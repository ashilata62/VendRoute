import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    return res.status(200).json({ success: true, message: 'Login successful', ...result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(201).json({ success: true, message: 'Registration successful', ...result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getProfileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const profile = await AuthService.getProfile(userId);
    return res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
