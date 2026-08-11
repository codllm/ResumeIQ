import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AI_CONFIG } from "../../config/ai.config";



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

export const sectionMCQQuestionSchema = z.object({
  sections: z.array(
    z.object({
      category: z.string().describe("The section category matching the assessment pattern."),
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
          topic: z
            .string()
            .describe("The technical topic or skill being tested."),
          explanation: z
            .string()
            .describe("A short explanation of why the correct answer is correct."),
          score: z.number().default(1).describe("Score value for the question."),
          difficulty: z
            .enum(["easy", "medium", "hard"])
            .describe("The difficulty level of the question."),
        })
      ).min(1),
    })
  ).min(1),
});

export type SectionMCQQuestions = z.infer<typeof sectionMCQQuestionSchema>;
export type MCQQuestion = SectionMCQQuestions;
export const mcqQuestionSchema = sectionMCQQuestionSchema;

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
  selfDesc: string,
  performanceContext?: string
): Promise<InterviewReport> {
  const ai = getAIClient();

  const performancePrompt = performanceContext
    ? `
Past mock test and mock interview performance:
${performanceContext}

Use this performance history heavily. Identify repeated weak areas, compare actual answers with expected readiness, and make the preparation plan adaptive to the user's real performance.
`
    : "";

  const prompt = `Generate a detailed interview report based on the following information: ${JSON.stringify({
    jobDescription: jobDesc,
    resumeText,
    selfDescription: selfDesc,
  })}

${performancePrompt}

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
- If past performance is provided, use it to adjust matchScore, skillGaps, questions, and preparationPlan.
- Output ONLY the JSON object matching the JSON schema.`;

  const jsonSchema = z.toJSONSchema(interviewReportSchema);

  try {
    const response = await ai.models.generateContent({
      model: AI_CONFIG.DEFAULT_MODEL,
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
  mocktestpattern: AssessmentPattern
): Promise<SectionMCQQuestions> => {
  const ai = getAIClient();

  const prompt = `
You are an expert recruitment assessment question generator.

Your task is to generate actual multiple-choice questions for a personalized mock assessment.

The assessment pattern has already been created. You MUST follow that pattern EXACTLY.


${resumeText}

${jobDescription}

${JSON.stringify(mocktestpattern, null, 2)}


1. Follow the assessment pattern EXACTLY.
2. Group the generated questions by section in the response.
3. For each section in "mocktestpattern.sections", generate EXACTLY the number of questions specified by "questionCount" under that "category".
4. Do NOT add extra questions or remove questions.
5. Every question MUST contain:
   - "question": string
   - "options": array of EXACTLY 4 strings
   - "correctAnswer": string (MUST EXACTLY match one of the four options)
   - "topic": string (MUST correspond to a topic from that section's "topicsToTest")
   - "explanation": concise explanation of why the correct answer is correct
   - "score": 1
   - "difficulty": "easy" | "medium" | "hard"
6. Prioritize the topics explicitly listed in "topicsToTest" for each section.
7. Do NOT introduce unrelated technologies or concepts.
8. For Aptitude sections, generate actual quantitative / logical / verbal reasoning problems rather than technical questions.
9. For Technical sections, test concepts and practical application.
10. For Resume/Project sections, focus on meaningful projects, technologies, and decisions mentioned in the resume.
`;

  const jsonSchema = z.toJSONSchema(sectionMCQQuestionSchema);

  try {
    const response = await ai.models.generateContent({
      model: AI_CONFIG.DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return sectionMCQQuestionSchema.parse(parsed);
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

interface InterviewTurnContext {
  question: string;
  answer?: string;
  feedback?: string;
}

export const generateTextquestion = async (
  resumeText: string,
  jobDescription: string,
  previousTurns: InterviewTurnContext[] = [],
  questionNumber = 1
): Promise<string> => {
  const ai = getAIClient();

  const previousContext = previousTurns.length
    ? `
Previous interview conversation:
${previousTurns
  .map(
    (turn, index) => `
Round ${index + 1}
Question: ${turn.question}
Answer: ${turn.answer || "No answer recorded"}
Feedback: ${turn.feedback || "No feedback recorded"}`
  )
  .join("\n")}
`
    : "";

  const prompt = `
You are an expert technical interviewer conducting a realistic mock interview.

Generate question number ${questionNumber} for the candidate based on their resume, the job description, and the previous interview conversation.

Candidate Resume:
${resumeText}

Job Description:
${jobDescription}

${previousContext}

Requirements:
- Ask only ONE question.
- The question must be highly relevant to the candidate's resume or target job.
- Prefer deep questions about projects, technologies, architecture, technical decisions, trade-offs, or implementation.
- The question should feel like something a real interviewer would ask.
- If previous answers exist, ask a natural follow-up or move to a new important topic.
- Do not repeat any previous question.
- Use a natural conversational tone.
- Do not provide an answer.
- Do not provide explanations.
- Do not provide multiple questions.
- Return ONLY the question as plain text.
`;

  try {
    const response = await ai.models.generateContent({
      model: AI_CONFIG.DEFAULT_MODEL,
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



export const assessmentPatternSchema = z.object({
  role: z.string().describe("Target role identified from job description."),

  totalDurationMinutes: z
    .number()
    .int()
    .min(45)
    .max(60)
    .describe("Total duration of the assessment in minutes (must be between 45 and 60)."),

  sections: z
    .array(
      z.object({
        category: z.string().describe("Section/category name, e.g. Technical, Aptitude, Resume / Projects, Behavioral."),

        questionCount: z.number().int().positive().describe("Number of questions in this section."),

        durationMinutes: z.number().int().positive().describe("Duration in minutes allocated for this section."),

        difficulty: z.enum(["easy", "medium", "hard", "mixed"]).describe("Difficulty level for this section."),

        reason: z.string().describe("Why this section is relevant to the role and experience level."),

        topicsToTest: z.array(z.string()).min(1).describe("List of topics to test in this section."),
      })
    )
    .min(1),
});

export type AssessmentPattern = z.infer<typeof assessmentPatternSchema>;

export async function generateAssessmentPattern(
  resumeText: string,
  jobDescription: string,
  experienceLevel: string
): Promise<AssessmentPattern> {
  const ai = getAIClient();

  const prompt = `
You are an expert recruitment assessment designer.

Your task is to design a realistic hiring assessment pattern for a candidate based on their RESUME, JOB DESCRIPTION, and EXPERIENCE LEVEL.

IMPORTANT:
Do NOT generate the actual questions.

Your ONLY task is to decide:
- Target role ("role")
- Total assessment duration in minutes ("totalDurationMinutes", MUST be between 45 and 60 minutes)
- Assessment sections ("sections"):
  * "category": Section name (e.g. Technical, Aptitude, Resume / Projects, Behavioral, etc.)
  * "questionCount": Number of questions in this section
  * "durationMinutes": Time allocated to this section (sum of all section durationMinutes MUST equal totalDurationMinutes)
  * "difficulty": "easy" | "medium" | "hard" | "mixed"
  * "reason": Why this section is relevant
  * "topicsToTest": Array of specific topics/skills to test in this section

==================================================
CANDIDATE INFORMATION
==================================================

EXPERIENCE LEVEL:
${experienceLevel}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

==================================================
ASSESSMENT DURATION AND TIMING
==================================================

- The total assessment duration ("totalDurationMinutes") MUST be between 45-60 minutes.
- Each section MUST have its own timer ("durationMinutes").
- The sum of all section "durationMinutes" MUST equal "totalDurationMinutes".
- Do NOT use a fixed question count. Decide the number of questions based on topic complexity.

==================================================
DO NOT TEST EVERYTHING
==================================================

- Do NOT create questions for every technology, keyword, or framework mentioned in the job description or resume.
- Prioritize CORE competencies for the target role.
- Coding / Programming MUST NOT be included automatically for every role. Include it ONLY when the role genuinely requires programming (e.g., Software Engineer).
- Aptitude MUST NOT be included automatically for every role. Include it ONLY when relevant to that role's expected hiring process.
- For non-technical roles (HR, Marketing, Sales, Finance, Operations), select domain-appropriate assessment sections (e.g., Domain Knowledge, Situational Judgment, Communication, Logical Reasoning, Business Analysis).

==================================================
EXPERIENCE LEVEL GUIDELINES
==================================================

- "College Student" / "Fresher": Focus on programming fundamentals, basic/intermediate DSA, OOP, DBMS/SQL, Computer Networks (when relevant), OS (when relevant), Aptitude (when relevant), core role fundamentals, resume/project questions. Avoid deep distributed systems or production architecture.
- "0–2 Years": Focus on strong fundamentals, practical programming, DSA, DBMS/SQL, role-specific tech, debugging, practical scenarios, projects, basic system design when relevant.
- "2–4 Years": Focus on practical problem solving, technical depth, debugging, production scenarios, architecture/design concepts, system design when relevant, trade-offs.
- "4+ Years": Focus on advanced role-specific knowledge, architecture, system design, scalability, reliability, production/debugging scenarios, technical trade-offs, design decisions.

Do NOT make every question extremely difficult simply because the candidate has more experience; test deeper trade-offs and design rationale.

==================================================
OUTPUT REQUIREMENT
==================================================

Return ONLY the valid JSON object matching the schema:
{
  "role": "string",
  "totalDurationMinutes": number,
  "sections": [
    {
      "category": "string",
      "questionCount": number,
      "durationMinutes": number,
      "difficulty": "easy" | "medium" | "hard" | "mixed",
      "reason": "string",
      "topicsToTest": ["topic1", "topic2"]
    }
  ]
}
`;

  const jsonSchema = z.toJSONSchema(assessmentPatternSchema);

  try {
    const response = await ai.models.generateContent({
      model: AI_CONFIG.DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return assessmentPatternSchema.parse(parsed);
  } catch (error: any) {
    const isQuotaError =
      error.status === 429 || (error.message && error.message.includes("429"));
    if (isQuotaError) {
      console.warn("Gemini API Quota Exceeded (429).");
      throw new Error("Gemini API Quota Exceeded (429). Please check your API key or limits.");
    }
    console.error("Error generating assessment pattern:", error.message || error);
    throw error;
  }
}

export const generatemocktestpattern = generateAssessmentPattern;
