import crypto from 'crypto';
import { prisma } from '../config/db.js';

const ENCRYPTION_KEY = process.env.MASTER_ENCRYPTION_KEY || 'f3b9c8e1a7d6f5b4c3e2a1d0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0';
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption failed for an integration config', err);
    return '';
  }
}

export class IntegrationConfigService {
  static async getAll() {
    const configs = await (prisma as any).integrationConfig.findMany();
    return configs.map((config: any) => {
      // Parse config Json if present (non-sensitive)
      let configJson = {};
      if (config.configJsonEncrypted) {
         try {
           configJson = JSON.parse(decrypt(config.configJsonEncrypted));
         } catch { /* ignore */ }
      }
      
      let credentials: any = {};
      if (config.credentialsEncrypted) {
         try {
           const parsed = JSON.parse(decrypt(config.credentialsEncrypted));
           // Mask credentials for frontend
           for (const key of Object.keys(parsed)) {
             const val = parsed[key];
             if (val && typeof val === 'string' && val.length > 4) {
               credentials[key] = '****************' + val.substring(val.length - 4);
             } else if (val) {
               credentials[key] = '****';
             }
           }
         } catch { /* ignore */ }
      }
      
      return {
        id: config.id,
        provider: config.provider,
        displayName: config.displayName,
        enabled: config.enabled,
        config: configJson,
        credentials: credentials, // masked
        updatedAt: config.updatedAt,
      };
    });
  }

  // Gets decrypted credentials (for backend use ONLY)
  static async getDecryptedConfig(provider: string): Promise<any> {
    const config = await (prisma as any).integrationConfig.findUnique({
      where: { provider }
    });
    if (!config || !config.enabled) {
      return null;
    }
    
    let credentials = {};
    if (config.credentialsEncrypted) {
      try {
        credentials = JSON.parse(decrypt(config.credentialsEncrypted));
      } catch (e) {
        console.error(`Failed to decrypt credentials for ${provider}`);
      }
    }
    
    let configJson = {};
    if (config.configJsonEncrypted) {
      try {
        configJson = JSON.parse(decrypt(config.configJsonEncrypted));
      } catch (e) {
        console.error(`Failed to decrypt configJson for ${provider}`);
      }
    }
    
    return { ...configJson, ...credentials };
  }

  static async saveConfig(provider: string, data: { displayName?: string, enabled: boolean, credentials?: any, configJson?: any }) {
    const existing = await (prisma as any).integrationConfig.findUnique({ where: { provider } });

    // Handle masked passwords from frontend. If they start with ***, we should NOT overwrite the DB with it.
    let finalCreds = data.credentials || {};
    if (existing && existing.credentialsEncrypted) {
      let existingCreds: any = {};
      try {
        existingCreds = JSON.parse(decrypt(existing.credentialsEncrypted));
      } catch (e) { /* ignore */ }
      
      for (const [key, val] of Object.entries(finalCreds)) {
        if (typeof val === 'string' && val.includes('****')) {
          finalCreds[key] = existingCreds[key];
        }
      }
    }

    const payload: any = {
      provider,
      enabled: data.enabled
    };
    if (data.displayName) payload.displayName = data.displayName;
    if (data.credentials) payload.credentialsEncrypted = encrypt(JSON.stringify(finalCreds));
    if (data.configJson) payload.configJsonEncrypted = encrypt(JSON.stringify(data.configJson));

    const updated = await (prisma as any).integrationConfig.upsert({
      where: { provider },
      update: payload,
      create: {
        provider,
        displayName: data.displayName || provider,
        enabled: data.enabled,
        credentialsEncrypted: encrypt(JSON.stringify(finalCreds)),
        configJsonEncrypted: data.configJson ? encrypt(JSON.stringify(data.configJson)) : null
      }
    });

    return {
      provider: updated.provider,
      enabled: updated.enabled,
      updatedAt: updated.updatedAt
    };
  }
}
