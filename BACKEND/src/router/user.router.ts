import { Router } from 'express';
import { userLogin,createUserController,logoutController,getMeController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
const router = Router();

// POST /api/user/login
router.post('/login', userLogin);
router.post('/create',createUserController);
router.get('/logout',logoutController);
router.get('/get-me',authenticateToken,getMeController);

export default router;