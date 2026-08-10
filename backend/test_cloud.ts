import { PrismaClient } from '@prisma/client';
import { IntegrationConfigService } from './src/services/integrationConfigService.js';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();
async function main() {
  const config = await IntegrationConfigService.getDecryptedConfig('cloudinary');
  console.log("Config:", config);
  
  if (config) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret
    });
    
    try {
      // Just ping to see if credentials are valid
      const ping = await cloudinary.api.ping();
      console.log("Ping:", ping);
      
      // Try to upload a dummy base64 image
      const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', { folder: 'vendroute' });
      console.log("Upload Success:", result.secure_url);
    } catch (e: any) {
      console.error("Upload Error:", e.message);
    }
  }
}
main();
