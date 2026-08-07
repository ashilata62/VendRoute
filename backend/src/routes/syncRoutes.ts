import { Router } from 'express';
import { syncOfflineData } from '../controllers/syncController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/', authenticateJWT, authorizeRoles('DRIVER'), syncOfflineData);
export default router;
