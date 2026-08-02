import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import upload from "../middleware/multer.middleware";
import { InterviewController } from "../controllers/interview.controller";

const router = Router();

// POST /api/ai/generate-interview-report
router.post(
  "/generate-interview-report",
  authenticateToken,
  upload.single("resume"),
  InterviewController
);

export default router;