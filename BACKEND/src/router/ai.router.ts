import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import upload from "../middleware/multer.middleware";
import {
  createCareerProfileController,
  getCareerProfilesController,
  InterviewController,
  mockInterviewAnswerController,
  mockInterviewController,
  mocktestController,
  submitmocktestcontroller,
  mockInterviewAudioController,
  updateCareerProfileController,
} from "../controllers/interview.controller";

const router = Router();

// POST /api/ai/generate-interview-report
router.post("/generate-interview-report",authenticateToken,upload.single("resume"),InterviewController);

router.post("/career-profile", authenticateToken, upload.single("resume"), createCareerProfileController);

router.get("/career-profiles", authenticateToken, getCareerProfilesController);

router.patch(
  "/career-profile/:profileId",
  authenticateToken,
  upload.single("resume"),
  updateCareerProfileController
);

router.post("/mock-test/start", authenticateToken, mocktestController);

router.post("/mock-interview/start", authenticateToken, mockInterviewController);

router.post("/mock-interview/answer",authenticateToken,upload.single("audioAnswer"),mockInterviewAnswerController);

router.post("/mock-test/submit",authenticateToken,submitmocktestcontroller);
router.get("/mock-interview/audio/:mockInterviewId", mockInterviewAudioController);

export default router;
