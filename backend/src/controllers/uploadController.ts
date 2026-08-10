import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { IntegrationConfigService } from '../services/integrationConfigService.js';
import fs from 'fs';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    // Check for Cloudinary config
    const config = await IntegrationConfigService.getDecryptedConfig('cloudinary');
    
    if (config && config.cloudName && config.apiKey && config.apiSecret) {
       cloudinary.config({
         cloud_name: config.cloudName,
         api_key: config.apiKey,
         api_secret: config.apiSecret
       });
       
       const result = await cloudinary.uploader.upload(req.file.path, { folder: 'vendroute' });
       
       // Clean up local file
       try { fs.unlinkSync(req.file.path); } catch (e) {}
       
       return res.status(200).json({ success: true, url: result.secure_url });
    }
    
    // Fallback to local storage if Cloudinary is not configured
    const url = `/uploads/${req.file.filename}`;
    return res.status(200).json({ success: true, url });
  } catch (error: any) { 
    return res.status(500).json({ success: false, message: error.message }); 
  }
};
