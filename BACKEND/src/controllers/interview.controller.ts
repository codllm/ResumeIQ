import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  generateInterviewReport,
  generatemockquestion,
  generateTextquestion,
} from "../services/ai/ai.service";
import InterviewReport from "../model/interview.report.model";
import MCQMockQuestion from "../model/mcqmock.model";
import {
  evaluateMockAnswer,
  generate_audio_text,
  generate_text_audio,
} from "../services/ai/generateaudio.service";
import MOCKInterview from "../model/mockInterview.model";

const pdfParseModule = require("pdf-parse");

/**
 * Extracts plain text from a PDF Buffer, supporting both pdf-parse v1 (function) and v2 (PDFParse class).
 */
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  if (typeof pdfParseModule === "function") {
    const data = await pdfParseModule(buffer);
    return data.text || "";
  } else if (pdfParseModule && pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    const result = await parser.getText();
    return typeof result === "string" ? result : result.text || "";
  } else if (typeof pdfParseModule.default === "function") {
    const data = await pdfParseModule.default(buffer);
    return data.text || "";
  }
  throw new Error("Unable to parse PDF: unsupported pdf-parse export.");
}

function getAuthenticatedUserId(req: Request): string | undefined {
  return (req as any).user?.id || (req as any).user?._id;
}

function toQuestionCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}

function normalizeScore(value: unknown): number | undefined {
  const score = Number(value);
  if (!Number.isFinite(score)) return undefined;
  return Math.min(10, Math.max(0, score));
}

async function findUserReport(reportId: string, userId: string) {
  if (!mongoose.isValidObjectId(reportId)) {
    return null;
  }

  return InterviewReport.findOne({
    _id: reportId,
    user: userId,
  });
}

export const InterviewController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. User ID not found in token.",
      });
      return;
    }

    const resumeFile = req.file;

    if (!resumeFile) {
      res.status(400).json({
        success: false,
        message: "Resume PDF file is required.",
      });
      return;
    }

    const { selfDescription, jobDescription } = req.body;

    if (!jobDescription || !selfDescription) {
      res.status(400).json({
        success: false,
        message: "Job description and self description are required.",
      });
      return;
    }

    // Parse text from uploaded PDF buffer
    const extractedText = await extractTextFromPdfBuffer(resumeFile.buffer);

    // Generate AI interview report
    const aiReport = await generateInterviewReport(
      jobDescription,
      extractedText,
      selfDescription
    );

    // Save the generated report into MongoDB
    const savedReport = await InterviewReport.create({
      user: userId,
      jobDescription,
      resumeText: extractedText,
      selfDescription,
      matchScore: aiReport.matchScore,
      technicalQuestions: aiReport.technicalQuestions,
      behavioralQuestions: aiReport.behavioralQuestions,
      skillGaps: aiReport.skillGaps,
      preparationPlan: aiReport.preparationPlan,
    });

    res.status(201).json({
      success: true,
      message: "Interview report generated and saved successfully.",
      report: savedReport,
    });
  } catch (error: any) {
    console.error("Error in InterviewController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate or save interview report.",
      error: error.message || error,
    });
  }
};

export const mocktestController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. User ID not found in token.",
      });
      return;
    }

    const { reportId, totalquestion, totalQuestions } = req.body;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: "reportId is required",
      });
      return;
    }

    const count = toQuestionCount(totalquestion ?? totalQuestions);

    const report = await findUserReport(reportId, userId);
    if (!report) {
      res.status(404).json({
        success: false,
        message: "Interview report not found for this user",
      });
      return;
    }

    const { resumeText, jobDescription } = report;

    if (!resumeText || !jobDescription) {
      res.status(400).json({
        success: false,
        message: "Interview report is missing resumeText or jobDescription",
      });
      return;
    }

    const aiResponse = await generatemockquestion(
      resumeText,
      jobDescription,
      count
    );

    if (!aiResponse || !aiResponse.questions || aiResponse.questions.length === 0) {
      res.status(502).json({
        success: false,
        message: "Failed to generate mock questions. Please try again later.",
      });
      return;
    }

    const questionsToInsert = aiResponse.questions.map((q) => ({
      interviewReport: reportId,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topic: q.topic,
      explanation: q.explanation,
      difficulty: q.difficulty,
    }));

    const savedQuestions = await MCQMockQuestion.insertMany(questionsToInsert);

    res.status(201).json({
      success: true,
      message: "Mock test questions generated and saved successfully",
      count: savedQuestions.length,
      data: savedQuestions,
    });
  } catch (error: any) {
    console.error("Error in mocktestController:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error while generating mock test",
    });
  }
};

export const mockInterviewController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. User ID not found in token.",
      });
      return;
    }

    const { reportId } = req.body;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: "Report ID is required",
      });
      return;
    }

    const report = await findUserReport(reportId, userId);

    if (!report) {
      res.status(404).json({
        success: false,
        message: "Interview report not found for this user",
      });
      return;
    }

    const { resumeText, jobDescription } = report;

    const text_form_q = await generateTextquestion(
      resumeText,
      jobDescription
    );

    if (!text_form_q) {
      res.status(502).json({
        success: false,
        message: "Failed to generate question text",
      });
      return;
    }

    const text_audio = await generate_text_audio(text_form_q);

    if (!text_audio) {
      res.status(502).json({
        success: false,
        message: "Failed to generate question-audio",
      });
      return;
    }

    const mockInterview = await MOCKInterview.create({
      question: text_form_q,
      user: userId,
      interviewReport: reportId,
    });

    res.status(201).json({
      success: true,
      message: "Mock interview question generated successfully",
      data: {
        mockInterviewId: mockInterview._id,
        reportId,
        text: text_form_q,
        audio: text_audio.buffer.toString("base64"),
        audioMimeType: text_audio.mimeType,
      },
    });

  } catch (error: any) {
    console.error("Mock Interview Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to start mock interview",
      error: error.message || error,
    });
  }
};

export const mockInterviewAnswerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. User ID not found in token.",
      });
      return;
    }

    const {
      reportId,
      mockInterviewId,
      text_form_q,
      question,
      answerText,
    } = req.body;
    const audioAnswer = req.file;
    const questionText = text_form_q || question;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: "Report ID is required",
      });
      return;
    }

    const report = await findUserReport(reportId, userId);

    if (!report) {
      res.status(404).json({
        success: false,
        message: "Interview report not found for this user",
      });
      return;
    }

    let mockInterview = null;

    if (mockInterviewId) {
      if (!mongoose.isValidObjectId(mockInterviewId)) {
        res.status(400).json({
          success: false,
          message: "Invalid mockInterviewId",
        });
        return;
      }

      mockInterview = await MOCKInterview.findOne({
        _id: mockInterviewId,
        user: userId,
        interviewReport: reportId,
      });

      if (!mockInterview) {
        res.status(404).json({
          success: false,
          message: "Mock interview session not found for this user",
        });
        return;
      }
    } else if (questionText) {
      mockInterview = await MOCKInterview.findOne({
        user: userId,
        interviewReport: reportId,
        question: questionText,
      }).sort({ createdAt: -1 });
    }

    if (!mockInterview && !questionText) {
      res.status(400).json({
        success: false,
        message: "mockInterviewId or question is required",
      });
      return;
    }

    if (!mockInterview) {
      mockInterview = await MOCKInterview.create({
        question: questionText,
        user: userId,
        interviewReport: reportId,
      });
    }

    let answer_text = typeof answerText === "string" ? answerText.trim() : "";

    if (!answer_text && audioAnswer) {
      answer_text = await generate_audio_text(
        audioAnswer.buffer,
        audioAnswer.mimetype
      );
    }

    if (!answer_text) {
      res.status(400).json({
        success: false,
        message: "Audio answer or answerText is required",
      });
      return;
    }

    const evaluation = await evaluateMockAnswer(
      mockInterview.question,
      answer_text
    );

    mockInterview.answer = answer_text;
    mockInterview.score = normalizeScore(evaluation?.score);
    mockInterview.technicalCorrectness = evaluation?.technicalCorrectness;
    mockInterview.feedback = evaluation?.feedback;
    await mockInterview.save();

    res.status(200).json({
      success: true,
      message: "Mock interview answer evaluated and saved successfully",
      question: mockInterview.question,
      answer: answer_text,
      evaluation,
      data: mockInterview,
    });

  } catch (error: any) {
    console.error("Mock interview answer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process interview answer",
      error: error.message || error,
    });
  }
};
