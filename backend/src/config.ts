import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  
  // Storage
  storageType: (process.env.STORAGE_TYPE || 'local') as 'local' | 's3',
  storagePath: process.env.STORAGE_PATH || path.join(__dirname, '../../storage'),
  
  // AWS S3 (optional)
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET,
  },
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Downloads
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '5', 10),
  downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT || '30000', 10),
  
  // Links
  linkExpiryHours: parseInt(process.env.LINK_EXPIRY_HOURS || '24', 10),
  maxDownloadsPerLink: parseInt(process.env.MAX_DOWNLOADS_PER_LINK || '0', 10),
  
  // Cleanup
  cleanupIntervalMinutes: parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '60', 10),
  maxFileAgeHours: parseInt(process.env.MAX_FILE_AGE_HOURS || '48', 10),
};
