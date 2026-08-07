import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadImage } from '../controllers/uploadController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let storage: any;

// Use Cloudinary if configured, otherwise fallback to local disk
if (process.env.CLOUDINARY_CLOUD_NAME) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'vendroute',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    } as any,
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  });
}

const upload = multer({ storage });

const router = Router();
router.post('/', authenticateJWT, upload.single('image'), uploadImage);
export default router;
