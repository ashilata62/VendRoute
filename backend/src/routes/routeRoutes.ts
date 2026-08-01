import { Router } from 'express';
import { getRoutes, getRouteById, createRoute, updateStopStatus } from '../controllers/routeController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createRouteSchema, updateStopStatusSchema } from '../validators/routeValidator.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getRoutes);
router.get('/:id', getRouteById);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createRouteSchema), createRoute);
router.patch('/stops/:stopId', validateRequest(updateStopStatusSchema), updateStopStatus);

export default router;
