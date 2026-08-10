import { PrismaClient } from '@prisma/client';
import { IntegrationConfigService } from './src/services/integrationConfigService.js';

const prisma = new PrismaClient();
async function main() {
  const config = await IntegrationConfigService.getDecryptedConfig('cloudinary');
  console.log(config);
}
main();
