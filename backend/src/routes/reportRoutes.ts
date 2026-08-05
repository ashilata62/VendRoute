import { Router } from 'express';
import { getDashboardStats } from '../controllers/reportController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/dashboard', authenticateJWT, getDashboardStats);

export default router;
