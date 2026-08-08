import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import upload from "../middleware/multer.middleware";
import {
  InterviewController,
  mockInterviewAnswerController,
  mockInterviewController,
  mocktestController,
} from "../controllers/interview.controller";

const router = Router();

// POST /api/ai/generate-interview-report
router.post(
  "/generate-interview-report",
  authenticateToken,
  upload.single("resume"),
  InterviewController
);

router.post("/mock-test/mode", authenticateToken, mocktestController);

router.post("/mock-interview/mode", authenticateToken, mockInterviewController);

router.post(
  "/mock-interview/answer",
  authenticateToken,
  upload.single("audioAnswer"),
  mockInterviewAnswerController
);

export default router;
