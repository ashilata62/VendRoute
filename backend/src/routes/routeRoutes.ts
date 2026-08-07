import { Router } from 'express';
import { getRoutes, getRouteById, createRoute, updateStopStatus, deleteRoute, updateRoute, optimizeRoute } from '../controllers/routeController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createRouteSchema, updateStopStatusSchema } from '../validators/routeValidator.js';

const router = Router();

// Testing mode — authenticateJWT on all routes
router.get('/', authenticateJWT, getRoutes);
router.get('/:id', authenticateJWT, getRouteById);
router.post('/', authenticateJWT, validateRequest(createRouteSchema), createRoute);
router.put('/:id', authenticateJWT, updateRoute);
router.patch('/stops/:stopId', authenticateJWT, validateRequest(updateStopStatusSchema), updateStopStatus);
router.post('/:id/optimize', authenticateJWT, optimizeRoute);
router.delete('/:id', authenticateJWT, deleteRoute);

export default router;
