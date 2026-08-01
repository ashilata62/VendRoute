import { Router } from 'express';
import authRoutes from './authRoutes.js';
import customerRoutes from './customerRoutes.js';
import locationRoutes from './locationRoutes.js';
import machineRoutes from './machineRoutes.js';
import routeRoutes from './routeRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/locations', locationRoutes);
apiRouter.use('/machines', machineRoutes);
apiRouter.use('/routes', routeRoutes);

export default apiRouter;
