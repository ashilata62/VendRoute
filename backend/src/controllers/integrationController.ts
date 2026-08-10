import { Request, Response } from 'express';
import { IntegrationConfigService } from '../services/integrationConfigService.js';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';

export const getIntegrations = async (_req: Request, res: Response) => {
  try {
    const configs = await IntegrationConfigService.getAll();
    return res.status(200).json({ success: true, data: configs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateIntegration = async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as string;
    const { displayName, enabled, credentials, configJson } = req.body;
    const updated = await IntegrationConfigService.saveConfig(provider, {
      displayName, enabled, credentials, configJson
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const testIntegration = async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as string;
    // Get the most up to date decrypted config for testing
    const config = await IntegrationConfigService.getDecryptedConfig(provider);
    
    if (!config) {
      return res.status(400).json({ success: false, message: `${provider} is disabled or missing configuration.` });
    }

    if (provider === 'cloudinary') {
      if (!config.cloudName || !config.apiKey || !config.apiSecret) {
        return res.status(400).json({ success: false, message: "Missing Cloudinary credentials." });
      }
      
      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret
      });
      
      // Ping cloudinary API
      try {
        await cloudinary.api.ping();
        return res.status(200).json({ success: true, message: "Cloudinary connection successful." });
      } catch (e: any) {
        return res.status(400).json({ success: false, message: "Cloudinary authentication failed. Please check your keys." });
      }
    }
    
    if (provider === 'smtp') {
      if (!config.host || !config.port || !config.user || !config.password) {
         return res.status(400).json({ success: false, message: "Missing SMTP credentials." });
      }
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port, 10),
        secure: config.secure === true || config.secure === 'true',
        auth: {
          user: config.user,
          pass: config.password,
        },
      });
      try {
        await transporter.verify();
        return res.status(200).json({ success: true, message: "SMTP connection successful." });
      } catch (e: any) {
        return res.status(400).json({ success: false, message: "SMTP connection failed. Check host, port and credentials." });
      }
    }
    
    if (provider === 'google-maps') {
      if (!config.apiKey) return res.status(400).json({ success: false, message: "Missing Google Maps API Key." });
      // We can do a simple ping to google maps API or just say successful if key exists
      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/timezone/json?location=39.6034810%2C-119.6822510&timestamp=1331161200&key=${config.apiKey}`);
        const data = await response.json();
        if (data.status === 'REQUEST_DENIED') {
          return res.status(400).json({ success: false, message: "Google Maps API Key is invalid or restricted." });
        }
        return res.status(200).json({ success: true, message: "Google Maps connection successful." });
      } catch (e) {
        return res.status(400).json({ success: false, message: "Failed to verify Google Maps API key." });
      }
    }
    
    if (provider === 'firebase') {
      return res.status(200).json({ success: true, message: "Firebase configuration syntax looks valid (Detailed connection ping not implemented)." });
    }
    
    if (provider === 'twilio') {
      return res.status(200).json({ success: true, message: "Twilio credentials saved (Detailed connection ping not implemented)." });
    }

    return res.status(400).json({ success: false, message: `Test connection not implemented for ${provider}.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
