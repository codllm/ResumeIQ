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
import User from "../model/user.model";
import { success } from "zod";


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

function toHundredPointScore(value: unknown): number {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Number((score * 10).toFixed(1))));
}

function toInterviewQuestionCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 6;
  return Math.min(8, Math.max(4, Math.floor(parsed)));
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

    const { name, resumeText, selfDescription, jobDescription, targetRole } = req.body;
    const resumeFile = req.file;

    if (!resumeFile && (!resumeText || !String(resumeText).trim())) {
      res.status(400).json({
        success: false,
        message: "Resume PDF file or resumeText is required.",
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
    const extractedText = resumeFile
      ? await extractTextFromPdfBuffer(resumeFile.buffer)
      : String(resumeText).trim();

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

    const profileId = String(req.params.profileId || "");

    if (profileId) {
      const careerProfile = await findUserCareerProfile(profileId, userId);

      if (!careerProfile) {
        res.status(404).json({
          success: false,
          message: "Career profile not found for this user.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        careerProfile,
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

    const {
      name,
      resumeText,
      selfDescription,
      jobDescription,
      targetRole,
      isActive,
    } = req.body;

    if (req.file) {
      careerProfile.resumeText = await extractTextFromPdfBuffer(req.file.buffer);
    } else if (typeof resumeText === "string" && resumeText.trim()) {
      careerProfile.resumeText = resumeText.trim();
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
      resumeText,
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

      if (!resumeFile && (!resumeText || !String(resumeText).trim())) {
        res.status(400).json({
          success: false,
          message: "Resume PDF file, resumeText, or careerProfileId is required.",
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

      const extractedText = resumeFile
        ? await extractTextFromPdfBuffer(resumeFile.buffer)
        : String(resumeText).trim();

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

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          "scoreCard.resumeReportCard": {
            date: new Date(),
            score: toHundredPointScore(aiReport.matchScore),
            scoreScale: 100,
          },
        },
      },
      { new: true }
    );

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
      message: "Our AI is currently experiencing high traffic. Please try again in a few moments.",
      error: error.message || error,
    });
  }
};

export const getInterviewReportsController = async (
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

    const reportId = String(req.params.reportId || "");
    const careerProfileId = req.query.careerProfileId ? String(req.query.careerProfileId) : "";

    if (reportId) {
      const report = await findUserReport(reportId, userId);
      if (!report) {
        res.status(404).json({
          success: false,
          message: "Interview report not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        report,
      });
      return;
    }

    const query: any = { user: userId };
    if (careerProfileId && mongoose.isValidObjectId(careerProfileId)) {
      query.careerProfile = careerProfileId;
    }

    const reports = await InterviewReport.find(query)
      .populate("careerProfile", "name targetRole")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error: any) {
    console.error("Error in getInterviewReportsController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interview reports.",
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
      sessionId: mockTestSession._id,
      role: mocktestpattern.role,
      totalDurationMinutes: mocktestpattern.totalDurationMinutes,
      totalQuestions: savedQuestions.length,
      totalScore,
      sections: responseSections,
      questions: savedQuestions,
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

    const {
      profileId,
      careerProfileId,
      profileName,
      profilename,
      reportId,
      totalQuestions,
    } = req.body;

    const selectedProfileId = profileId || careerProfileId;
    const selectedProfileName = profileName || profilename;
    let profile: any = null;
    let report: any = null;

    if (selectedProfileId) {
      profile = await findUserCareerProfile(String(selectedProfileId), userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Career profile not found for this user.",
        });
        return;
      }
    } else if (selectedProfileName) {
      const cleanName = String(selectedProfileName).trim();
      profile = await CareerProfile.findOne({
        user: userId,
        isActive: true,
        $or: [{ name: cleanName }, { targetRole: cleanName }],
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Career profile not found for this user.",
        });
        return;
      }
    } else if (reportId) {
      report = await findUserReport(String(reportId), userId);
      if (!report) {
        res.status(404).json({
          success: false,
          message: "Interview report not found for this user.",
        });
        return;
      }

      if (report.careerProfile) {
        profile = await findUserCareerProfile(String(report.careerProfile), userId);
      }
    } else {
      res.status(400).json({
        success: false,
        message: "profileId is required to start an interview.",
      });
      return;
    }

    const resumeText = profile?.resumeText || report?.resumeText;
    const jobDescription = profile?.jobDescription || report?.jobDescription;

    if (!resumeText || !jobDescription) {
      res.status(400).json({
        success: false,
        message: "Resume or job description is missing from the selected profile.",
      });
      return;
    }

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

    const text_audio = await generate_text_audio(text_form_q);

    if (!text_audio) {
      res.status(502).json({
        success: false,
        message: "Failed to generate question audio",
      });
      return;
    }

    const careerProfileObjectId = profile?._id || report?.careerProfile;
    const interviewReportObjectId = report?._id;
    const mockInterview = await MOCKInterview.create({
      question: text_form_q,
      user: userId,
      careerProfile: careerProfileObjectId,
      interviewReport: interviewReportObjectId,
      audio: {
        data: text_audio.buffer,
        mimeType: text_audio.mimeType,
      },
    });

    const mockInterviewSession = await MockInterviewSession.create({
      user: userId,
      careerProfile: careerProfileObjectId,
      interviewReport: interviewReportObjectId,
      questions: [mockInterview._id],
      transcript: [{ question: text_form_q }],
      totalQuestions: totalInterviewQuestions,
      currentQuestionNumber: 1,
    });

    res.status(201).json({
      success: true,
      message: "Mock interview question generated successfully",
      data: {
        mockInterviewSessionId: mockInterviewSession._id,
        sessionId: mockInterviewSession._id,
        mockInterviewId: mockInterview._id,
        profileId: careerProfileObjectId,
        reportId: interviewReportObjectId,
        text: text_form_q,
        audioUrl: `/api/ai/mock-interview/audio/${mockInterview._id}`,
        questionNumber: 1,
        totalQuestions: totalInterviewQuestions,
        durationSeconds: 13 * 60,
        estimatedDurationMinutes: "10-13",
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
      profileId,
      careerProfileId,
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

    let mockInterviewSession: any = null;

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
      });

      if (!mockInterviewSession) {
        res.status(404).json({
          success: false,
          message: "Mock interview session not found for this user",
        });
        return;
      }
    }

    let report: any = null;
    let profile: any = null;
    const selectedProfileId =
      careerProfileId || profileId || mockInterviewSession?.careerProfile;
    const selectedReportId = reportId || mockInterviewSession?.interviewReport;

    if (selectedProfileId) {
      profile = await findUserCareerProfile(String(selectedProfileId), userId);
    }

    if (selectedReportId) {
      report = await findUserReport(String(selectedReportId), userId);
    }

    if (!profile && !report) {
      res.status(404).json({
        success: false,
        message: "Interview profile context not found for this user.",
      });
      return;
    }

    const sourceResumeText = profile?.resumeText || report?.resumeText;
    const sourceJobDescription = profile?.jobDescription || report?.jobDescription;

    if (!sourceResumeText || !sourceJobDescription) {
      res.status(400).json({
        success: false,
        message: "Resume or job description is missing for this interview.",
      });
      return;
    }

    let mockInterview: any = null;

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
      });

      if (!mockInterview) {
        res.status(404).json({
          success: false,
          message: "Mock interview question not found for this user",
        });
        return;
      }

      if (
        mockInterviewSession &&
        !mockInterviewSession.questions.some(
          (savedQuestionId: mongoose.Types.ObjectId) =>
            savedQuestionId.toString() === mockInterview._id.toString()
        )
      ) {
        res.status(403).json({
          success: false,
          message: "This question does not belong to the active interview session.",
        });
        return;
      }

      if (!mockInterviewSession) {
        mockInterviewSession = await MockInterviewSession.findOne({
          user: userId,
          questions: mockInterview._id,
        });
      }
    } else if (questionText) {
      const questionQuery: any = {
        user: userId,
        question: questionText,
      };

      if (mockInterviewSession?.careerProfile) {
        questionQuery.careerProfile = mockInterviewSession.careerProfile;
      }

      if (mockInterviewSession?.interviewReport) {
        questionQuery.interviewReport = mockInterviewSession.interviewReport;
      }

      mockInterview = await MOCKInterview.findOne(questionQuery).sort({
        createdAt: -1,
      });
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
        careerProfile: profile?._id || report?.careerProfile,
        interviewReport: report?._id,
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

    mockInterview.answer = answer_text;
    await mockInterview.save();

    let nextQuestionData = null;
    let isComplete = false;
    let finalResult = null;

    if (mockInterviewSession) {
      const wasAlreadyComplete = mockInterviewSession.status === "completed";
      const existingTranscriptIndex = mockInterviewSession.transcript.findIndex(
        (turn: any) => turn.question === mockInterview.question
      );

      const completedTurn = {
        question: mockInterview.question,
        answer: answer_text,
      };

      if (existingTranscriptIndex >= 0) {
        mockInterviewSession.transcript[existingTranscriptIndex] = completedTurn;
      } else {
        mockInterviewSession.transcript.push(completedTurn);
      }

      const answeredTurns = mockInterviewSession.transcript.filter(
        (turn: any) => Boolean(turn.answer)
      );

      if (answeredTurns.length >= mockInterviewSession.totalQuestions) {
        mockInterviewSession.status = "completed";
        mockInterviewSession.completedAt = new Date();
        mockInterviewSession.currentQuestionNumber = answeredTurns.length;
        isComplete = true;

        if (!wasAlreadyComplete) {
          const evaluatedTurns = [];

          for (let index = 0; index < answeredTurns.length; index += 1) {
            const turn = answeredTurns[index];
            const evaluation = await evaluateMockAnswer(turn.question, turn.answer);
            const score = normalizeScore(evaluation?.score);
            const evaluatedTurn = {
              question: turn.question,
              answer: turn.answer,
              score,
              feedback: evaluation?.feedback,
              technicalCorrectness: evaluation?.technicalCorrectness,
            };

            evaluatedTurns.push(evaluatedTurn);

            const questionId = mockInterviewSession.questions[index];
            if (questionId) {
              await MOCKInterview.findOneAndUpdate(
                {
                  _id: questionId,
                  user: userId,
                },
                {
                  score,
                  feedback: evaluation?.feedback,
                  technicalCorrectness: evaluation?.technicalCorrectness,
                }
              );
            }
          }

          mockInterviewSession.transcript = evaluatedTurns;

          const averageScore =
            evaluatedTurns.reduce(
              (sum: number, turn: any) => sum + (Number(turn.score) || 0),
              0
            ) / evaluatedTurns.length;

          finalResult = {
            averageScore: Number(averageScore.toFixed(1)),
            scorePercentage: toHundredPointScore(averageScore),
            totalQuestions: evaluatedTurns.length,
            transcript: evaluatedTurns,
          };

          await User.findByIdAndUpdate(userId, {
            $push: {
              "scoreCard.mockInterviewReportCard": {
                date: new Date(),
                score: toHundredPointScore(averageScore),
                scoreScale: 100,
              },
            },
          });
        } else {
          const evaluatedTurns = mockInterviewSession.transcript.filter(
            (turn: any) => Boolean(turn.answer)
          );
          const averageScore =
            evaluatedTurns.reduce(
              (sum: number, turn: any) => sum + (Number(turn.score) || 0),
              0
            ) / Math.max(1, evaluatedTurns.length);

          finalResult = {
            averageScore: Number(averageScore.toFixed(1)),
            scorePercentage: toHundredPointScore(averageScore),
            totalQuestions: evaluatedTurns.length,
            transcript: evaluatedTurns,
          };
        }
      } else {
        const nextQuestionNumber = answeredTurns.length + 1;
        const nextQuestionText = await generateTextquestion(
          sourceResumeText,
          sourceJobDescription,
          answeredTurns.map((turn: any) => ({
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
          careerProfile: profile?._id || report?.careerProfile,
          interviewReport: report?._id,
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
          totalQuestions: mockInterviewSession.totalQuestions,
        };
      }

      await mockInterviewSession.save();
    }

    res.status(200).json({
      success: true,
      message: isComplete
        ? "Mock interview completed and evaluated successfully"
        : "Mock interview answer saved successfully",
      mockInterviewSessionId: mockInterviewSession?._id,
      question: mockInterview.question,
      answer: answer_text,
      data: mockInterview,
      finalResult,
      interview: mockInterviewSession
        ? {
            status: mockInterviewSession.status,
            isComplete,
            currentQuestionNumber: mockInterviewSession.currentQuestionNumber,
            totalQuestions: mockInterviewSession.totalQuestions,
            durationSeconds: 13 * 60,
            transcript: mockInterviewSession.transcript,
            finalResult,
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

    const normalizedMockTestScore =
      mockTestSession.totalScore > 0
        ? Number(((mocktestscore / mockTestSession.totalScore) * 100).toFixed(1))
        : 0;

    await User.findByIdAndUpdate(userId, {
      $push: {
        "scoreCard.mocktestReportCard": {
          date: new Date(),
          score: normalizedMockTestScore,
          scoreScale: 100,
        },
      },
    });

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

export const onlineAssessmentReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const profileID = String(req.body?.profileID || req.query?.careerProfileId || req.query?.profileID || "");

    if (!profileID || !mongoose.isValidObjectId(profileID)) {
      res.status(400).json({ success: false, message: "Valid profileID is required" });
      return;
    }

    const careerProfile = await CareerProfile.findOne({ _id: profileID, user: userId });

    if (!careerProfile) {
      res.status(404).json({ success: false, message: "Career profile not found" });
      return;
    }

    const attemptedOAs = await MockTestSession.find({ careerProfile: profileID, user: userId, status: "submitted" });

    const oaReports = attemptedOAs.map((oa: any) => {
      return {
        mocktestId: oa._id,
        score: oa.score,
        totalScore: oa.totalScore,
        totalQuestions: oa.questions?.length || 0,
        attemptedQuestions: oa.answers?.length || 0,
        submittedAt: oa.submittedAt
      };
    });
    res.status(200).json({ success: true, oaReports });
  } catch (error: any) {
    console.error("Error in onlineAssessmentReport:", error);
    res.status(500).json({ success: false, message: "Failed to fetch online assessment reports", error: error.message });
  }
};
