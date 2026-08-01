import { Router } from 'express';
import { getLocations, getLocationById, createLocation } from '../controllers/locationController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createLocationSchema } from '../validators/locationValidator.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getLocations);
router.get('/:id', getLocationById);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createLocationSchema), createLocation);

export default router;
