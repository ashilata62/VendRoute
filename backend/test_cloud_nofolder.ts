import { PrismaClient } from '@prisma/client';
import { IntegrationConfigService } from './src/services/integrationConfigService.js';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();
async function main() {
  const config = await IntegrationConfigService.getDecryptedConfig('cloudinary');
  
  if (config) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret
    });
    
    try {
      const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
      console.log("Upload Success Without Folder:", result.secure_url);
    } catch (e: any) {
      console.error("Upload Error Without Folder:", e.message);
    }
  }
}
main();
