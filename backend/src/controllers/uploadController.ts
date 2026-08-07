import { Request, Response } from 'express';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const isCloudinary = req.file.path && req.file.path.startsWith('http');
    const url = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    return res.status(200).json({ success: true, url });
  } catch (error: any) { return res.status(500).json({ success: false, message: error.message }); }
};
