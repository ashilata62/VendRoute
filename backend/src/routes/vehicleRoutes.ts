import { Router } from 'express';
import { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateJWT, getVehicles);
router.get('/:id', authenticateJWT, getVehicleById);
router.post('/', authenticateJWT, createVehicle);
router.put('/:id', authenticateJWT, updateVehicle);
router.delete('/:id', authenticateJWT, deleteVehicle);

export default router;
