import Queue from 'bull';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { DownloadJob, DownloadOptions } from '../models/DownloadJob.js';
import { extractPlaylistInfo, fetchHtml } from '../services/sunoScraper.js';
import { downloadSong } from '../services/downloader.js';
import { createZipArchive } from '../services/zipCreator.js';
import { createShareLink } from '../services/linkManager.js';
import { getTempDir, getMetadataPath, deleteJobFiles } from '../utils/storage.js';
import { config } from '../config.js';

const downloadQueue = new Queue('suno-downloads', config.redisUrl);

export async function createDownloadJob(url: string, options: DownloadOptions = {}): Promise<DownloadJob> {
  const jobId = uuidv4();
  const now = new Date();
  
  const job: DownloadJob = {
    id: jobId,
    url,
    status: 'queued',
    progress: {
      total: 0,
      completed: 0,
      failed: 0
    },
    createdAt: now,
    updatedAt: now
  };
  
  // Save initial job metadata
  saveJobMetadata(job);
  
  // Add to queue
  await downloadQueue.add({
    jobId,
    url,
    options
  });
  
  return job;
}

export function saveJobMetadata(job: DownloadJob): void {
  const metadataPath = getMetadataPath(job.id);
  fs.writeFileSync(metadataPath, JSON.stringify(job, null, 2));
}

export function loadJobMetadata(jobId: string): DownloadJob | null {
  try {
    const metadataPath = getMetadataPath(jobId);
    if (!fs.existsSync(metadataPath)) return null;
    
    const data = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(data) as DownloadJob;
  } catch {
    return null;
  }
}

// Process jobs
downloadQueue.process(async (bullJob) => {
  const { jobId, url, options } = bullJob.data;
  
  let job = loadJobMetadata(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  try {
    // Update status to processing
    job.status = 'processing';
    job.updatedAt = new Date();
    saveJobMetadata(job);
    
    // Fetch and parse Suno page
    const html = await fetchHtml(url);
    const playlistInfo = extractPlaylistInfo(html);
    
    job.playlistInfo = playlistInfo;
    job.progress.total = playlistInfo.songs.length;
    saveJobMetadata(job);
    
    // Create temp directory
    const tempDir = getTempDir(jobId);
    
    // Download each song
    for (let i = 0; i < playlistInfo.songs.length; i++) {
      const song = playlistInfo.songs[i]!;
      job.progress.currentSong = song.title || song.id;
      saveJobMetadata(job);
      
      const result = await downloadSong(song, tempDir, i);
      
      if (result.success) {
        job.progress.completed++;
      } else {
        job.progress.failed++;
      }
      
      saveJobMetadata(job);
    }
    
    // Create ZIP archive
    const archivePath = await createZipArchive(jobId, playlistInfo.name);
    job.archivePath = archivePath;
    
    // Create shareable link
    const shareCode = await createShareLink(jobId);
    job.shareCode = shareCode;
    job.expiresAt = new Date(Date.now() + config.linkExpiryHours * 60 * 60 * 1000);
    
    // Mark as completed
    job.status = 'completed';
    job.updatedAt = new Date();
    job.progress.currentSong = undefined;
    saveJobMetadata(job);
    
  } catch (error) {
    // Mark as failed
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.updatedAt = new Date();
    saveJobMetadata(job);
    
    throw error;
  }
});

export { downloadQueue };
export default downloadQueue;
