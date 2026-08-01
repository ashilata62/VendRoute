import { Router } from 'express';
import { getMachines, createMachine, updateMachineStock } from '../controllers/machineController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createMachineSchema, updateMachineStockSchema } from '../validators/machineValidator.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getMachines);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createMachineSchema), createMachine);
router.patch('/:id/stock', validateRequest(updateMachineStockSchema), updateMachineStock);

export default router;
