import { Router } from 'express';
import { userLogin, createUserController, logoutController, getMeController, userScoreCard } from '../controllers/user.controller';
import { createCareerProfileController } from '../controllers/interview.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import upload from '../middleware/multer.middleware';

const router = Router();

// POST /api/user/login
router.post('/login', userLogin);
router.post('/create', createUserController);
router.get('/logout', logoutController);
router.get('/get-me', authenticateToken, getMeController);
// Kept as a backwards-compatible alias for clients using the earlier route.
router.post('/upload/carrier/profile', authenticateToken, upload.single('resume'), createCareerProfileController);
router.get('/score-card', authenticateToken, userScoreCard);

export default router;
