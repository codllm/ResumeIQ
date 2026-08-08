import { GoogleGenAI } from "@google/genai";
import { success, z } from "zod";
import { resume } from "../../dummy";
import { model } from "mongoose";



export const interviewReportSchema = z.object({
  technicalQuestions: z.array(
    z.object({
      question: z.string().describe("The technical question asked during the interview."),
      answer: z.string().describe("The candidate's answer to the technical question."),
      intention: z.string().describe("The intention behind the technical question, explaining what the interviewer is trying to assess."),
      tags: z.string().describe("Tags or topic names where the question belongs.")
    })
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string().describe("The behavioral question asked during the interview."),
      answer: z.string().describe("The candidate's answer to the behavioral question."),
      intention: z.string().describe("The intention behind the behavioral question, explaining what the interviewer is trying to assess."),
      tags: z.string().describe("Tags or topic names where the question belongs.")
    })
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string().describe("The specific skill that the candidate is lacking or needs improvement in."),
      severity: z.string().describe("The severity of the skill gap, indicating how critical it is for the candidate's performance in the role."),
    })
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number().describe("The day number in the preparation plan, indicating the sequence of the preparation steps."),
      focus: z.string().describe("The main focus or topic for that day in the preparation plan, outlining what the candidate should concentrate on."),
      tasks: z.array(z.string()).describe("A list of tasks or activities that the candidate should complete on that day to prepare for the interview."),
    })
  ),
  matchScore: z.number().min(0).max(10).describe("The candidate's score matching the job role, ranging from 0 to 10."),
});

export type InterviewReport = z.infer<typeof interviewReportSchema>;

export const mcqQuestionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("The multiple-choice question."),
      options: z
        .array(z.string())
        .length(4)
        .describe("Exactly four possible answer options."),
      correctAnswer: z
        .string()
        .describe("The correct answer. It must exactly match one of the four options."),
      difficulty: z
        .enum(["easy", "medium", "hard"])
        .describe("The difficulty level of the question."),
      topic: z
        .string()
        .describe("The technical topic or skill being tested."),
      explanation: z
        .string()
        .describe("A short explanation of why the correct answer is correct."),
    })
  ),
});

export type MCQQuestion = z.infer<typeof mcqQuestionSchema>;

// ==========================================
// HELPERS
// ==========================================

function getAIClient() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

function normalizeMatchScore(raw: unknown): number {
  if (typeof raw === "number" && !isNaN(raw)) {
    return Math.min(10, Math.max(0, raw));
  }

  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      const scaled = parsed > 10 ? parsed / 10 : parsed;
      return Math.min(10, Math.max(0, scaled));
    }
  }

  return 0;
}

function sanitizeInterviewReport(raw: any): InterviewReport {
  const report: InterviewReport = {
    technicalQuestions: Array.isArray(raw?.technicalQuestions) ? raw.technicalQuestions : [],
    behavioralQuestions: Array.isArray(raw?.behavioralQuestions) ? raw.behavioralQuestions : [],
    skillGaps: Array.isArray(raw?.skillGaps) ? raw.skillGaps : [],
    preparationPlan: Array.isArray(raw?.preparationPlan) ? raw.preparationPlan : [],
    matchScore: normalizeMatchScore(raw?.matchScore),
  };

  const emptyFields = (Object.keys(report) as (keyof InterviewReport)[]).filter(
    (key) => Array.isArray(report[key]) && (report[key] as any[]).length === 0
  );
  if (emptyFields.length > 0) {
    console.warn(
      `Gemini response deviated from expected schema — empty fields: ${emptyFields.join(", ")}`
    );
  }

  return report;
}

// ==========================================
// AI GENERATION FUNCTIONS
// ==========================================

/**
 * Generates an interview report using Gemini AI given job description, resume, and self description.
 */
export async function generateInterviewReport(
  jobDesc: string,
  resumeText: string,
  selfDesc: string
): Promise<InterviewReport> {
  const ai = getAIClient();

  const prompt = `Generate a detailed interview report based on the following information: ${JSON.stringify({
    jobDescription: jobDesc,
    resumeText,
    selfDescription: selfDesc,
  })}

You must respond with a JSON object containing EXACTLY these top-level keys, and no others: "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan", "matchScore".

Follow this exact shape:

{
  "technicalQuestions": [
    { "question": "string", "answer": "string", "intention": "string", "tags": "string" }
  ],
  "behavioralQuestions": [
    { "question": "string", "answer": "string", "intention": "string", "tags": "string" }
  ],
  "skillGaps": [
    { "skill": "string", "severity": "string" }
  ],
  "preparationPlan": [
    { "day": 1, "focus": "string", "tasks": ["string", "string"] }
  ],
  "matchScore": 7.8
}

Rules:
- "technicalQuestions" and "behavioralQuestions": include at least 4 items each, based on the resume and job description.
- "skillGaps": include every required/preferred skill from the job description that is missing or weak in the resume.
- "preparationPlan": a multi-day study plan (at least 3 days), each with a focus area and a list of concrete tasks.
- "matchScore" must be a plain number between 0 and 10 (e.g. 8.2) — not a string, not a percentage, no "%" sign or units.
- Output ONLY the JSON object matching the JSON schema.`;

  const jsonSchema = z.toJSONSchema(interviewReportSchema);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return sanitizeInterviewReport(parsed);
  } catch (error: any) {
    const isQuotaError = error.status === 429 || (error.message && error.message.includes("429"));
    if (isQuotaError) {
      console.warn("Gemini API Quota Exceeded (429).");
      throw new Error("Gemini API Quota Exceeded (429). Please update GOOGLE_GENAI_API_KEY in .env");
    }

    console.error("Gemini AI API Error:", error.message || error);
    throw error;
  }
}

/**
 * Generates multiple-choice mock questions tailored to the resume and job description.
 */
export const generatemockquestion = async (
  resumeText: string,
  jobDescription: string,
  totalquestion: number
): Promise<MCQQuestion> => {
  const prompt = `
Generate exactly ${totalquestion} multiple-choice questions based on the candidate's resume and the given job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Requirements:
1. Generate exactly ${totalquestion} questions.
2. Each question must have exactly 4 answer options.
3. Only ONE option must be correct.
4. The "correctAnswer" string must EXACTLY match one of the four entries in the "options" array.
5. Questions must directly evaluate skills and requirements present in the candidate's resume and target job.
6. Target difficulty distribution:
   - ~40% Easy
   - ~40% Medium
   - ~20% Hard
7. Avoid duplicate or highly similar questions.
8. Test real practical knowledge and problem-solving scenarios rather than basic rote memorization.
9. Provide a concise explanation for why the chosen correct answer is correct.
10. Explicitly state the topic or skill being tested for each question.
`;

  const ai = getAIClient();
  const jsonSchema = z.toJSONSchema(mcqQuestionSchema);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    // Strict validation using Zod schema
    return mcqQuestionSchema.parse(parsed);

  } catch (error: any) {
    const isQuotaError =
      error.status === 429 || (error.message && error.message.includes("429"));

    if (isQuotaError) {
      console.warn("Gemini API quota exceeded (429).");
      throw new Error("Gemini API Quota Exceeded. Please check your API key or limits.");
    }

    console.error("Gemini MCQ generation error:", error.message || error);
    throw error;
  }
};

export const generateTextquestion = async (
  resumeText: string,
  jobDescription: string
): Promise<string> => {
  const ai = getAIClient();

  const prompt = `
You are an expert technical interviewer conducting a realistic mock interview.

Generate ONE interview question for the candidate based on their resume and the job description.

Candidate Resume:
${resumeText}

Job Description:
${jobDescription}

Requirements:
- Ask only ONE question.
- The question must be highly relevant to the candidate's resume or target job.
- Prefer deep questions about projects, technologies, architecture, technical decisions, trade-offs, or implementation.
- The question should feel like something a real interviewer would ask.
- Use a natural conversational tone.
- Do not provide an answer.
- Do not provide explanations.
- Do not provide multiple questions.
- Return ONLY the question as plain text.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const question = response.text?.trim();

    if (!question) {
      throw new Error("Gemini did not generate an interview question");
    }

    return question;

  } catch (err) {
    console.error("Error generating interview question:", err);
    throw err;
  }
};