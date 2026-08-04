import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const interviewReportSchema = z.object({
  technicalQuestions: z.array(
    z.object({
      question: z.string().describe("The technical question asked during the interview."),
      answer: z.string().describe("The candidate's answer to the technical question."),
      intention: z.string().describe("The intention behind the technical question, explaining what the interviewer is trying to assess."),
    })
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string().describe("The behavioral question asked during the interview."),
      answer: z.string().describe("The candidate's answer to the behavioral question."),
      intention: z.string().describe("The intention behind the behavioral question, explaining what the interviewer is trying to assess."),
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

function getAIClient() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Defensively normalizes the matchScore field returned by the AI model.
 * Handles cases where the model returns a percentage string (e.g. "82%"),
 * a fraction-like string (e.g. "8.5/10"), a 0-100 scale number, or a clean
 * 0-10 number. Falls back to 0 if the value is totally unparseable.
 */
function normalizeMatchScore(raw: unknown): number {
  if (typeof raw === "number" && !isNaN(raw)) {
    return Math.min(10, Math.max(0, raw));
  }

  if (typeof raw === "string") {
    // Strip anything that isn't a digit or a dot, e.g. "82%" -> "82", "8.5/10" -> "8.5"
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      // If the model gave a 0-100 style percentage, scale it down to 0-10
      const scaled = parsed > 10 ? parsed / 10 : parsed;
      return Math.min(10, Math.max(0, scaled));
    }
  }

  return 0;
}

/**
 * Validates and coerces the raw parsed JSON into a shape safe to persist,
 * regardless of minor formatting deviations from the model.
 */
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
      `Gemini response deviated from the expected schema — empty fields: ${emptyFields.join(", ")}. Raw keys received: ${Object.keys(raw || {}).join(", ")}`
    );
  }

  return report;
}

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

Do NOT use any other key names (no "candidateName", "summary", "skillsAnalysis", "missingSkills", "interviewQuestions", "recommendation", etc.). Follow this exact shape:

{
  "technicalQuestions": [
    { "question": "string", "answer": "string", "intention": "string" }
  ],
  "behavioralQuestions": [
    { "question": "string", "answer": "string", "intention": "string" }
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
- Output ONLY the JSON object. No markdown, no code fences, no commentary, no extra keys.`;

  // Zod v4 has native JSON Schema conversion built in. The separate
  // `zod-to-json-schema` package (v3.x) is built for Zod v3's internal
  // structure and silently produces an empty/broken schema against Zod v4 —
  // that was the root cause of the model improvising its own field names
  // and returning plain strings instead of objects.
  const jsonSchema = z.toJSONSchema(interviewReportSchema);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        // The installed @google/genai SDK does not expose `responseFormat`.
        // Use responseMimeType + responseJsonSchema instead, which accepts
        // standard JSON Schema directly (unlike the older `responseSchema`
        // field, which expects an OpenAPI-subset Schema object and is the
        // field that was silently ignoring our zod-to-json-schema output).
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const text = response.text || "{}";

    // Temporary debug log — remove once you've confirmed the fields populate.
    console.log("Raw Gemini response text:", text);

    const parsed = JSON.parse(text);
    return sanitizeInterviewReport(parsed);
  } catch (error: any) {
    const isQuotaError = error.status === 429 || (error.message && error.message.includes("429"));
    if (isQuotaError) {
      console.warn(
        "Gemini AI API Quota Exceeded (429). Please update GOOGLE_GENAI_API_KEY in .env with a fresh key from https://aistudio.google.com/app/apikey"
      );
      throw new Error(
        "Gemini API Quota Exceeded (429). Please update GOOGLE_GENAI_API_KEY in .env with a fresh key from https://aistudio.google.com/app/apikey"
      );
    }

    console.error("Gemini AI API Error:", error.message || error);
    throw error;
  }
}