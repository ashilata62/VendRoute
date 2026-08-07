import { Router } from 'express';
import { createLog, updateLog, deleteLog, getLogs } from '../controllers/inventoryController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('DRIVER', 'SUPERVISOR', 'ADMIN'), createLog);
router.get('/', authenticateJWT, getLogs);
router.put('/:id', authenticateJWT, authorizeRoles('DRIVER', 'SUPERVISOR', 'ADMIN'), updateLog);
router.delete('/:id', authenticateJWT, authorizeRoles('SUPERVISOR', 'ADMIN'), deleteLog);

export default router;
