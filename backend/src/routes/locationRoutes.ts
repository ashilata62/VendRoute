import { Router } from 'express';
import { getLocations, getLocationById, createLocation, updateLocation, deleteLocation } from '../controllers/locationController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createLocationSchema } from '../validators/locationValidator.js';

const router = Router();

// Testing mode — authenticateJWT on all routes
router.get('/', authenticateJWT, getLocations);
router.get('/:id', authenticateJWT, getLocationById);
router.post('/', authenticateJWT, validateRequest(createLocationSchema), createLocation);
router.put('/:id', authenticateJWT, updateLocation);
router.delete('/:id', authenticateJWT, deleteLocation);

export default router;
