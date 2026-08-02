import { Request, Response } from "express";
import { generateInterviewReport } from "../services/ai/ai.service";
import InterviewReport from "../model/interview.report.model";

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

export const InterviewController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;

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