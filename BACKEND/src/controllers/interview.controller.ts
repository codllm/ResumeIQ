import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  generateInterviewReport,
  generatemockquestion,
  generateTextquestion,
  generatemocktestpattern,
} from "../services/ai/ai.service";
import CareerProfile from "../model/careerProfile.model";
import InterviewReport from "../model/interview.report.model";
import MCQMockQuestion from "../model/mcqmock.model";
import MockTestSession from "../model/mockTestSession.model";
import {
  evaluateMockAnswer,
  generate_audio_text,
  generate_text_audio,
} from "../services/ai/generateaudio.service";
import MOCKInterview from "../model/mockInterview.model";
import MockInterviewSession from "../model/mockInterviewSession.model";


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

function toInterviewQuestionCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(10, Math.max(1, Math.floor(parsed)));
}

function normalizeReportType(value: unknown): "base" | "performance" {
  return value === "performance" ? "performance" : "base";
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

async function findUserCareerProfile(profileId: string, userId: string) {
  if (!mongoose.isValidObjectId(profileId)) {
    return null;
  }

  return CareerProfile.findOne({
    _id: profileId,
    user: userId,
  });
}

async function buildPerformanceContext(
  userId: string,
  careerProfileId: mongoose.Types.ObjectId
) {
  const reports = await InterviewReport.find({
    user: userId,
    careerProfile: careerProfileId,
  }).select("_id matchScore reportType createdAt");

  const reportIds = reports.map((report) => report._id);

  const mockTests = await MockTestSession.find({
    user: userId,
    $or: [
      { careerProfile: careerProfileId },
      { interviewReport: { $in: reportIds } },
    ],
    status: "submitted",
  })
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(5)
    .populate("answers.question", "category topic question explanation");

  const mockInterviews = await MockInterviewSession.find({
    user: userId,
    $or: [
      { careerProfile: careerProfileId },
      { interviewReport: { $in: reportIds } },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(5);

  if (mockTests.length === 0 && mockInterviews.length === 0) {
    return {
      context: "",
      sourceMockTests: [],
      sourceMockInterviews: [],
    };
  }

  const testSummary = mockTests.map((test, index) => {
    const weakAnswers = test.answers
      .filter((answer) => !answer.isCorrect)
      .slice(0, 8)
      .map((answer: any) => {
        const question = answer.question;
        return {
          category: question?.category,
          topic: question?.topic,
          question: question?.question,
          chosenAnswer: answer.chosenAnswer,
          correctAnswer: answer.correctAnswer,
        };
      });

    return {
      attempt: index + 1,
      score: test.score,
      totalScore: test.totalScore,
      sections: test.sections.map((section) => section.category),
      weakAnswers,
    };
  });

  const interviewSummary = mockInterviews.map((interview, index) => ({
    interview: index + 1,
    status: interview.status,
    totalQuestions: interview.totalQuestions,
    transcript: interview.transcript.map((turn) => ({
      question: turn.question,
      answer: turn.answer,
      score: turn.score,
      feedback: turn.feedback,
      technicalCorrectness: turn.technicalCorrectness,
    })),
  }));

  return {
    context: JSON.stringify(
      {
        previousBaseReports: reports.map((report) => ({
          reportId: report._id,
          reportType: report.reportType,
          matchScore: report.matchScore,
          createdAt: report.createdAt,
        })),
        mockTests: testSummary,
        mockInterviews: interviewSummary,
      },
      null,
      2
    ),
    sourceMockTests: mockTests.map((test) => test._id),
    sourceMockInterviews: mockInterviews.map((interview) => interview._id),
  };
}

export const createCareerProfileController = async (
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

    const { name, selfDescription, jobDescription, targetRole } = req.body;
    const resumeFile = req.file;

    if (!resumeFile) {
      res.status(400).json({
        success: false,
        message: "Resume PDF file is required.",
      });
      return;
    }

    if (!jobDescription || !selfDescription) {
      res.status(400).json({
        success: false,
        message: "Job description and self description are required.",
      });
      return;
    }

    // Parse text from uploaded PDF buffer
    const extractedText = await extractTextFromPdfBuffer(resumeFile.buffer);

    const careerProfile = await CareerProfile.create({
      user: userId,
      name: name?.trim() || targetRole?.trim() || "Career Profile",
      resumeText: extractedText,
      jobDescription,
      selfDescription,
      targetRole,
    });

    res.status(201).json({
      success: true,
      message: "Career profile saved successfully.",
      careerProfile,
    });
  } catch (error: any) {
    console.error("Error in createCareerProfileController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save career profile.",
      error: error.message || error,
    });
  }
};

export const getCareerProfilesController = async (
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

    const careerProfiles = await CareerProfile.find({
      user: userId,
      isActive: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      careerProfiles,
    });
  } catch (error: any) {
    console.error("Error in getCareerProfilesController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch career profiles.",
      error: error.message || error,
    });
  }
};

export const updateCareerProfileController = async (
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

    const profileId = String(req.params.profileId || "");
    const careerProfile = await findUserCareerProfile(profileId, userId);

    if (!careerProfile) {
      res.status(404).json({
        success: false,
        message: "Career profile not found for this user.",
      });
      return;
    }

    const { name, selfDescription, jobDescription, targetRole, isActive } = req.body;

    if (req.file) {
      careerProfile.resumeText = await extractTextFromPdfBuffer(req.file.buffer);
    }

    if (typeof name === "string" && name.trim()) {
      careerProfile.name = name.trim();
    }

    if (typeof selfDescription === "string" && selfDescription.trim()) {
      careerProfile.selfDescription = selfDescription.trim();
    }

    if (typeof jobDescription === "string" && jobDescription.trim()) {
      careerProfile.jobDescription = jobDescription.trim();
    }

    if (typeof targetRole === "string") {
      careerProfile.targetRole = targetRole.trim();
    }

    if (typeof isActive === "boolean") {
      careerProfile.isActive = isActive;
    }

    await careerProfile.save();

    res.status(200).json({
      success: true,
      message: "Career profile updated successfully.",
      careerProfile,
    });
  } catch (error: any) {
    console.error("Error in updateCareerProfileController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update career profile.",
      error: error.message || error,
    });
  }
};

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

    const {
      careerProfileId,
      profileId,
      reportType,
      mode,
      name,
      selfDescription,
      jobDescription,
      targetRole,
    } = req.body;

    const selectedProfileId = careerProfileId || profileId;
    const normalizedReportType = normalizeReportType(reportType || mode);
    let careerProfile = null;
    let sourceMockTests: mongoose.Types.ObjectId[] = [];
    let sourceMockInterviews: mongoose.Types.ObjectId[] = [];
    let performanceContext = "";

    if (selectedProfileId) {
      careerProfile = await findUserCareerProfile(selectedProfileId, userId);

      if (!careerProfile) {
        res.status(404).json({
          success: false,
          message: "Career profile not found for this user.",
        });
        return;
      }
    } else {
      const resumeFile = req.file;

      if (!resumeFile) {
        res.status(400).json({
          success: false,
          message: "Resume PDF file or careerProfileId is required.",
        });
        return;
      }

      if (!jobDescription || !selfDescription) {
        res.status(400).json({
          success: false,
          message: "Job description and self description are required.",
        });
        return;
      }

      const extractedText = await extractTextFromPdfBuffer(resumeFile.buffer);

      careerProfile = await CareerProfile.create({
        user: userId,
        name: name?.trim() || targetRole?.trim() || "Career Profile",
        resumeText: extractedText,
        jobDescription,
        selfDescription,
        targetRole,
      });
    }

    if (normalizedReportType === "performance") {
      const performance = await buildPerformanceContext(
        userId,
        careerProfile._id as mongoose.Types.ObjectId
      );

      performanceContext = performance.context;
      sourceMockTests = performance.sourceMockTests as mongoose.Types.ObjectId[];
      sourceMockInterviews = performance.sourceMockInterviews as mongoose.Types.ObjectId[];

      if (!performanceContext) {
        res.status(400).json({
          success: false,
          message:
            "No submitted mock tests or mock interviews found for this career profile. Generate a base report and complete practice first.",
        });
        return;
      }
    }

    // Generate AI interview report
    const aiReport = await generateInterviewReport(
      careerProfile.jobDescription,
      careerProfile.resumeText,
      careerProfile.selfDescription,
      performanceContext
    );

    // Save the generated report into MongoDB
    const savedReport = await InterviewReport.create({
      user: userId,
      careerProfile: careerProfile._id,
      reportType: normalizedReportType,
      sourceMockTests,
      sourceMockInterviews,
      jobDescription: careerProfile.jobDescription,
      resumeText: careerProfile.resumeText,
      selfDescription: careerProfile.selfDescription,
      matchScore: aiReport.matchScore,
      technicalQuestions: aiReport.technicalQuestions,
      behavioralQuestions: aiReport.behavioralQuestions,
      skillGaps: aiReport.skillGaps,
      preparationPlan: aiReport.preparationPlan,
    });

    res.status(201).json({
      success: true,
      message: "Interview report generated and saved successfully.",
      careerProfile,
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

    const { reportId, experienceLevel } = req.body;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: "reportId is required",
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

    if (!resumeText || !jobDescription) {
      res.status(400).json({
        success: false,
        message: "Interview report is missing resumeText or jobDescription",
      });
      return;
    }

    const expLevelString = typeof experienceLevel === "string" && experienceLevel.trim()
      ? experienceLevel.trim()
      : "Fresher";

    const mocktestpattern = await generatemocktestpattern(
      resumeText,
      jobDescription,
      expLevelString
    );

    if (!mocktestpattern || !mocktestpattern.sections || mocktestpattern.sections.length === 0) {
      res.status(500).json({
        success: false,
        message: "Internal server error. Sorry, we failed to generate your test pattern.",
      });
      return;
    }

    const aiResponse = await generatemockquestion(
      resumeText,
      jobDescription,
      mocktestpattern
    );

    if (!aiResponse || !aiResponse.sections || aiResponse.sections.length === 0) {
      res.status(502).json({
        success: false,
        message: "Failed to generate mock questions. Please try again later.",
      });
      return;
    }

    const questionsToInsert: Array<{
      interviewReport: string;
      category: string;
      question: string;
      options: string[];
      correctAnswer: string;
      topic: string;
      explanation: string;
      difficulty: "easy" | "medium" | "hard";
      score: number;
    }> = [];

    for (const section of aiResponse.sections) {
      for (const q of section.questions) {
        questionsToInsert.push({
          interviewReport: reportId,
          category: section.category,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          topic: q.topic,
          explanation: q.explanation,
          difficulty: q.difficulty,
          score: q.score || 1,
        });
      }
    }

    //all questions which generated through the ai are store into mcq-mock-test-model
    const savedQuestions = await MCQMockQuestion.insertMany(questionsToInsert);

    const totalScore = savedQuestions.reduce(
      (sum, question) => sum + (question.score || 1),
      0
    );

    //here one seesion of mock-test has been created jo question user ne test diya hai
    const mockTestSession = await MockTestSession.create({
      user: userId,
      careerProfile: report.careerProfile,
      interviewReport: reportId,
      role: mocktestpattern.role,
      experienceLevel: expLevelString,
      totalDurationMinutes: mocktestpattern.totalDurationMinutes,
      sections: mocktestpattern.sections,
      questions: savedQuestions.map((question) => question._id),
      totalScore,
    });

    const responseSections = mocktestpattern.sections.map((sec) => {
      const matchingSaved = savedQuestions.filter((q) => q.category === sec.category);
      return {
        category: sec.category,
        questionCount: sec.questionCount,
        durationMinutes: sec.durationMinutes,
        difficulty: sec.difficulty,
        reason: sec.reason,
        topicsToTest: sec.topicsToTest,
        questions: matchingSaved,
      };
    });

    res.status(201).json({
      success: true,
      message: "Mock test questions generated and saved successfully",
      mocktestId: mockTestSession._id,
      role: mocktestpattern.role,
      totalDurationMinutes: mocktestpattern.totalDurationMinutes,
      totalQuestions: savedQuestions.length,
      totalScore,
      sections: responseSections,
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

    const { reportId, totalQuestions } = req.body;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: "Report ID is required",
      });
      return;
    }

    // Find the report belonging to this user
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
        message: "Resume or job description is missing",
      });
      return;
    }

    // --------------------------------
    // 1. Generate interview question
    // --------------------------------

    const totalInterviewQuestions = toInterviewQuestionCount(totalQuestions);

    const text_form_q = await generateTextquestion(
      resumeText,
      jobDescription,
      [],
      1
    );

    if (!text_form_q) {
      res.status(502).json({
        success: false,
        message: "Failed to generate question text",
      });
      return;
    }

    // --------------------------------
    // 2. Convert question → audio
    // --------------------------------

    const text_audio = await generate_text_audio(text_form_q);

    if (!text_audio) {
      res.status(502).json({
        success: false,
        message: "Failed to generate question audio",
      });
      return;
    }

    // --------------------------------
    // 3. Save question + audio
    // --------------------------------

    const mockInterview = await MOCKInterview.create({
      question: text_form_q,

      user: userId,

      interviewReport: reportId,

      audio: {
        data: text_audio.buffer,
        mimeType: text_audio.mimeType,
      },
    });

    const mockInterviewSession = await MockInterviewSession.create({
      user: userId,
      careerProfile: report.careerProfile,
      interviewReport: reportId,
      questions: [mockInterview._id],
      transcript: [{ question: text_form_q }],
      totalQuestions: totalInterviewQuestions,
      currentQuestionNumber: 1,
    });

    // --------------------------------
    // 4. Return only URL, NOT Base64
    // --------------------------------

    res.status(201).json({
      success: true,

      message: "Mock interview question generated successfully",

      data: {
        mockInterviewSessionId: mockInterviewSession._id,

        mockInterviewId: mockInterview._id,

        reportId,

        text: text_form_q,

        audioUrl: `/api/ai/mock-interview/audio/${mockInterview._id}`,

        questionNumber: 1,

        totalQuestions: totalInterviewQuestions,

        isComplete: false,
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
      mockInterviewSessionId,
      sessionId,
      mockInterviewId,
      text_form_q,
      question,
      answerText,
    } = req.body;
    const audioAnswer = req.file;
    const questionText = text_form_q || question;
    const interviewSessionId = mockInterviewSessionId || sessionId;

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

    let mockInterviewSession = null;

    if (interviewSessionId) {
      if (!mongoose.isValidObjectId(interviewSessionId)) {
        res.status(400).json({
          success: false,
          message: "Invalid mockInterviewSessionId",
        });
        return;
      }

      mockInterviewSession = await MockInterviewSession.findOne({
        _id: interviewSessionId,
        user: userId,
        interviewReport: reportId,
      });

      if (!mockInterviewSession) {
        res.status(404).json({
          success: false,
          message: "Mock interview session not found for this user",
        });
        return;
      }
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

      if (!mockInterviewSession) {
        mockInterviewSession = await MockInterviewSession.findOne({
          user: userId,
          interviewReport: reportId,
          questions: mockInterview._id,
        });
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

    let nextQuestionData = null;
    let isComplete = false;

    if (mockInterviewSession) {
      const existingTranscriptIndex = mockInterviewSession.transcript.findIndex(
        (turn) => turn.question === mockInterview.question
      );

      const completedTurn = {
        question: mockInterview.question,
        answer: answer_text,
        score: normalizeScore(evaluation?.score),
        feedback: evaluation?.feedback,
        technicalCorrectness: evaluation?.technicalCorrectness,
      };

      if (existingTranscriptIndex >= 0) {
        mockInterviewSession.transcript[existingTranscriptIndex] = completedTurn;
      } else {
        mockInterviewSession.transcript.push(completedTurn);
      }

      const answeredTurns = mockInterviewSession.transcript.filter(
        (turn) => Boolean(turn.answer)
      );

      if (answeredTurns.length >= mockInterviewSession.totalQuestions) {
        mockInterviewSession.status = "completed";
        mockInterviewSession.completedAt = new Date();
        mockInterviewSession.currentQuestionNumber = answeredTurns.length;
        isComplete = true;
      } else {
        const nextQuestionNumber = answeredTurns.length + 1;
        const nextQuestionText = await generateTextquestion(
          report.resumeText,
          report.jobDescription,
          answeredTurns.map((turn) => ({
            question: turn.question,
            answer: turn.answer,
            feedback: turn.feedback,
          })),
          nextQuestionNumber
        );

        const nextQuestionAudio = await generate_text_audio(nextQuestionText);
        const nextMockInterview = await MOCKInterview.create({
          question: nextQuestionText,
          user: userId,
          interviewReport: reportId,
          audio: {
            data: nextQuestionAudio.buffer,
            mimeType: nextQuestionAudio.mimeType,
          },
        });

        mockInterviewSession.questions.push(nextMockInterview._id);
        mockInterviewSession.transcript.push({ question: nextQuestionText });
        mockInterviewSession.currentQuestionNumber = nextQuestionNumber;

        nextQuestionData = {
          mockInterviewId: nextMockInterview._id,
          text: nextQuestionText,
          audioUrl: `/api/ai/mock-interview/audio/${nextMockInterview._id}`,
          questionNumber: nextQuestionNumber,
        };
      }

      await mockInterviewSession.save();
    }

    res.status(200).json({
      success: true,
      message: "Mock interview answer evaluated and saved successfully",
      mockInterviewSessionId: mockInterviewSession?._id,
      question: mockInterview.question,
      answer: answer_text,
      evaluation,
      data: mockInterview,
      interview: mockInterviewSession
        ? {
            status: mockInterviewSession.status,
            isComplete,
            currentQuestionNumber: mockInterviewSession.currentQuestionNumber,
            totalQuestions: mockInterviewSession.totalQuestions,
            nextQuestion: nextQuestionData,
          }
        : undefined,
    });

  } catch (error: any) {
    console.error("Mock interview answer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process interview answer",
      error: error.message || error,
    });
  }
}

export const submitmocktestcontroller = async (
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

    const { mocktestId, mocktestsheet } = req.body;

    if (!mocktestId) {
      res.status(400).json({
        success: false,
        message: "Required details missing: mocktestId",
      });
      return;
    }

    if (
      !mocktestsheet ||
      !Array.isArray(mocktestsheet.questions)
    ) {
      res.status(400).json({
        success: false,
        message: "mocktestsheet.questions must be an array",
      });
      return;
    }

    if (!mongoose.isValidObjectId(mocktestId)) {
      res.status(400).json({
        success: false,
        message: "Invalid mocktestId",
      });
      return;
    }

    const mockTestSession = await MockTestSession.findOne({
      _id: mocktestId,
      user: userId,
    });

    if (!mockTestSession) {
      res.status(404).json({
        success: false,
        message: "Mock test session not found for this user",
      });
      return;
    }

    if (mockTestSession.status === "submitted") {
      res.status(409).json({
        success: false,
        message: "This mock test has already been submitted",
      });
      return;
    }

    let mocktestscore = 0;
    const savedAnswers = [];
    const review = [];

    for (const q of mocktestsheet.questions) {
      const question = await MCQMockQuestion.findById(q.questionId);

      if (!question) {
        continue;
      }

      const questionBelongsToSession = mockTestSession.questions.some(
        (questionId) => questionId.toString() === question._id.toString()
      );

      if (!questionBelongsToSession) {
        continue;
      }

      const isCorrect = question.correctAnswer === q.chosenAnswer;
      const earnedScore = isCorrect ? question.score || 1 : 0;

      mocktestscore += earnedScore;

      savedAnswers.push({
        question: question._id,
        chosenAnswer: q.chosenAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        score: earnedScore,
      });

      review.push({
        questionId: question._id,
        question: question.question,
        chosenAnswer: q.chosenAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        score: earnedScore,
        explanation: question.explanation,
        category: question.category,
        topic: question.topic,
      });
    }

    mockTestSession.answers = savedAnswers;
    mockTestSession.score = mocktestscore;
    mockTestSession.status = "submitted";
    mockTestSession.submittedAt = new Date();
    await mockTestSession.save();

    res.status(200).json({
      success: true,
      mocktestId: mockTestSession._id,
      mocktestscore,
      totalScore: mockTestSession.totalScore,
      totalQuestions: mockTestSession.questions.length,
      attemptedQuestions: savedAnswers.length,
      review,
    });
    return;

  } catch (error: any) {
    console.error("Submit mock test error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit mock test",
    });
    return;
  }
};


export const mockInterviewAudioController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { mockInterviewId } = req.params;

    if (!mockInterviewId) {
      res.status(400).json({
        success: false,
        message: "Mock interview ID is required",
      });
      return;
    }

    const mockInterview = await MOCKInterview.findById(
      mockInterviewId
    );

    if (!mockInterview) {
      res.status(404).json({
        success: false,
        message: "Mock interview not found",
      });
      return;
    }

    if (!mockInterview.audio?.data) {
      res.status(404).json({
        success: false,
        message: "Audio not found",
      });
      return;
    }

    res.set({
      "Content-Type": mockInterview.audio.mimeType || "audio/wav",
      "Content-Length": mockInterview.audio.data.length.toString(),
      "Content-Disposition": "inline",
    });

    res.send(mockInterview.audio.data);

  } catch (error: any) {
    console.error("Audio error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get audio",
      error: error.message,
    });
  }
};
