import { Router } from 'express';
import { getStops, checkInStop } from '../controllers/stopController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateJWT, getStops);
router.put('/:id/checkin', authenticateJWT, checkInStop);

export default router;
