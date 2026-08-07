import { Router } from 'express';
import { punchIn, punchOut, breakStart, breakEnd, getHistory } from '../controllers/attendanceController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/punch-in', authenticateJWT, authorizeRoles('DRIVER'), punchIn);
router.post('/punch-out', authenticateJWT, authorizeRoles('DRIVER'), punchOut);
router.post('/break-start', authenticateJWT, authorizeRoles('DRIVER'), breakStart);
router.post('/break-end', authenticateJWT, authorizeRoles('DRIVER'), breakEnd);
router.get('/history', authenticateJWT, getHistory);

export default router;
