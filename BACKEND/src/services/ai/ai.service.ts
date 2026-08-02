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

// Helper function to get GoogleGenAI client instance
function getAIClient() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generates an interview report using Gemini AI given job description, resume, and self description.
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini 3.6flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema as any,
      },
    });

    const text = response.text || "{}";
    return JSON.parse(text) as InterviewReport;
  } catch (error: any) {
    console.error("Gemini AI API Error:", error.message || error);
    throw error;
  }
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