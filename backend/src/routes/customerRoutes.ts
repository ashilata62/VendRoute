import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customerValidator.js';

const router = Router();

// All routes use authenticateJWT — testing mode (mock login active)
// When real login is enabled, switch authenticateJWT → authenticateJWT for write routes
router.get('/', authenticateJWT, getCustomers);
router.get('/:id', authenticateJWT, getCustomerById);
router.post('/', authenticateJWT, validateRequest(createCustomerSchema), createCustomer);
router.put('/:id', authenticateJWT, validateRequest(updateCustomerSchema), updateCustomer);
router.delete('/:id', authenticateJWT, deleteCustomer);

export default router;
