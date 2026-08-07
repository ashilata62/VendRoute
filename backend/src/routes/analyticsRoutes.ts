import { Router } from 'express';
import { getDashboardStats, getDriverPerformance } from '../controllers/analyticsController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/dashboard', authenticateJWT, authorizeRoles('ADMIN', 'SUPERVISOR'), getDashboardStats);
router.get('/driver/:driverId', authenticateJWT, authorizeRoles('ADMIN', 'SUPERVISOR'), getDriverPerformance);

export default router;
