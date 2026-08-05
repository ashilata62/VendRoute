import { Router } from 'express';
import { getMachines, createMachine, updateMachineStock } from '../controllers/machineController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createMachineSchema, updateMachineStockSchema } from '../validators/machineValidator.js';

const router = Router();

// Testing mode — authenticateJWT on all routes
router.get('/', authenticateJWT, getMachines);
router.post('/', authenticateJWT, validateRequest(createMachineSchema), createMachine);
router.patch('/:id/stock', authenticateJWT, validateRequest(updateMachineStockSchema), updateMachineStock);

export default router;
