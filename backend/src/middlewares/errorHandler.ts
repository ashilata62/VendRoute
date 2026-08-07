import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message, errors: err.errors });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};
