import { Router } from 'express';
import { getUsers, getUserById, createUser, deleteUser, updateUser } from '../controllers/userController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateJWT, getUsers);
router.post('/', authenticateJWT, createUser);
router.get('/:id', authenticateJWT, getUserById);
router.put('/:id', authenticateJWT, updateUser);
router.delete('/:id', authenticateJWT, deleteUser);

export default router;
