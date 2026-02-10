import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { config } from '../config.js';
import { deleteJobFiles } from './storage.js';
import { deleteShareLink } from '../services/linkManager.js';
import { loadJobMetadata } from '../queue/downloadQueue.js';

export function startCleanupJob(): void {
  // Run cleanup every X minutes
  cron.schedule(`*/${config.cleanupIntervalMinutes} * * * *`, async () => {
    console.log('[Cleanup] Running scheduled cleanup...');
    
    try {
      const metadataDir = path.join(config.storagePath, 'metadata');
      if (!fs.existsSync(metadataDir)) return;
      
      const now = Date.now();
      const maxAge = config.maxFileAgeHours * 60 * 60 * 1000;
      
      const files = fs.readdirSync(metadataDir);
      let cleaned = 0;
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const jobId = file.replace('.json', '');
        const filePath = path.join(metadataDir, file);
        const stats = fs.statSync(filePath);
        
        // Check if file is too old
        if (now - stats.mtime.getTime() > maxAge) {
          // Delete associated files
          deleteJobFiles(jobId);
          
          // Delete share link if exists
          const job = loadJobMetadata(jobId);
          if (job?.shareCode) {
            await deleteShareLink(job.shareCode);
          }
          
          cleaned++;
        }
      }
      
      console.log(`[Cleanup] Cleaned ${cleaned} expired jobs`);
    } catch (err) {
      console.error('[Cleanup] Failed to run cleanup:', err);
    }
  });
  
  console.log(`[Cleanup] Scheduled cleanup job (every ${config.cleanupIntervalMinutes} minutes)`);
}
