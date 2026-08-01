import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customerValidator.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', authorizeRoles('ADMIN'), validateRequest(createCustomerSchema), createCustomer);
router.put('/:id', authorizeRoles('ADMIN'), validateRequest(updateCustomerSchema), updateCustomer);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer);

export default router;
