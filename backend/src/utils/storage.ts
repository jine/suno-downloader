import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getTempDir(jobId: string): string {
  const dir = path.join(config.storagePath, 'temp', jobId);
  ensureDir(dir);
  return dir;
}

export function getArchivePath(jobId: string): string {
  ensureDir(path.join(config.storagePath, 'archives'));
  return path.join(config.storagePath, 'archives', `${jobId}.zip`);
}

export function getMetadataPath(jobId: string): string {
  ensureDir(path.join(config.storagePath, 'metadata'));
  return path.join(config.storagePath, 'metadata', `${jobId}.json`);
}

export function deleteJobFiles(jobId: string): void {
  try {
    // Delete temp directory
    const tempDir = path.join(config.storagePath, 'temp', jobId);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    
    // Delete archive
    const archivePath = path.join(config.storagePath, 'archives', `${jobId}.zip`);
    if (fs.existsSync(archivePath)) {
      fs.unlinkSync(archivePath);
    }
    
    // Delete metadata
    const metadataPath = path.join(config.storagePath, 'metadata', `${jobId}.json`);
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
  } catch (err) {
    console.error(`Failed to delete files for job ${jobId}:`, err);
  }
}

export function listExpiredJobs(maxAgeHours: number): string[] {
  const metadataDir = path.join(config.storagePath, 'metadata');
  if (!fs.existsSync(metadataDir)) return [];
  
  const expiredJobs: string[] = [];
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  
  const files = fs.readdirSync(metadataDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(metadataDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        expiredJobs.push(file.replace('.json', ''));
      }
    }
  }
  
  return expiredJobs;
}
