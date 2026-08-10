import { Router } from 'express';
import { getIntegrations, updateIntegration, testIntegration } from '../controllers/integrationController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// Only SUPERVISOR and ADMIN can manage integrations
router.use(authenticateJWT, authorizeRoles('SUPERVISOR', 'ADMIN'));

router.get('/', getIntegrations);
router.post('/:provider', updateIntegration);
router.post('/:provider/test', testIntegration);

export default router;
