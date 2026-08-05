import { Router } from 'express';
import authRoutes from './authRoutes.js';
import customerRoutes from './customerRoutes.js';
import locationRoutes from './locationRoutes.js';
import machineRoutes from './machineRoutes.js';
import routeRoutes from './routeRoutes.js';
import userRoutes from './userRoutes.js';
import reportRoutes from './reportRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import stopRoutes from './stopRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/locations', locationRoutes);
apiRouter.use('/machines', machineRoutes);
apiRouter.use('/routes', routeRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/vehicles', vehicleRoutes);
apiRouter.use('/stops', stopRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/settings', settingsRoutes);

export default apiRouter;
