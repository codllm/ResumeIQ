import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { resume as dummyResume, selfDescription as dummySelfDescription, jobDescription as dummyJobDescription } from "../../dummy";

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

// List of fallback models to cycle through if rate limited
const MODELS_TO_TRY = ["Gemini 3 Flash Preview"];

/**
 * Generates an interview report using Gemini AI given job description, resume, and self description.
 * Automatically tries fallback models if quota limit (429) is encountered.
 */
export async function generateInterviewReport(
  jobDesc: string = dummyJobDescription,
  resumeText: string = dummyResume,
  selfDesc: string = dummySelfDescription
): Promise<InterviewReport> {
  const ai = getAIClient();

  const prompt = `Generate a detailed interview report based on the following information: ${JSON.stringify({
    jobDescription: jobDesc,
    resumeText,
    selfDescription: selfDesc,
  })}`;

  const jsonSchema = zodToJsonSchema(interviewReportSchema as any);

  let lastError: any = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: jsonSchema as any,
        },
      });

      const text = response.text || "{}";
      return JSON.parse(text) as InterviewReport;
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error.status === 429 || (error.message && error.message.includes("429"));
      if (isQuotaError) {
        console.warn(`[Gemini AI] Quota limit reached for model '${modelName}'. Trying fallback model...`);
        continue;
      }
      throw error;
    }
  }

  console.error("Gemini AI API Error: All model attempts exhausted due to rate limits/quota.");
  throw new Error(
    "Gemini API Quota Exceeded (429). Please update GOOGLE_GENAI_API_KEY in .env with a fresh key from https://aistudio.google.com/app/apikey"
  );
}

/**
 * Legacy wrapper using dummy data
 */
export async function invokeGeminiai(): Promise<InterviewReport | null> {
  try {
    return await generateInterviewReport();
  } catch (err: any) {
    console.error("Failed to generate AI interview report on startup:", err.message || err);
    return null;
  }
}