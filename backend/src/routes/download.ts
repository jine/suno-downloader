import { Router } from 'express';
import { createDownloadJob, loadJobMetadata } from '../queue/downloadQueue.js';
import { getShareLinkData, isLinkValid, incrementDownloadCount } from '../services/linkManager.js';
import { getArchivePath } from '../utils/storage.js';

const router = Router();

// POST /api/download - Start a new download
router.post('/download', async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate URL
    if (!url.match(/^https?:\/\/(www\.)?suno\.com\/(playlist|song|@)/)) {
      return res.status(400).json({ error: 'Invalid Suno URL' });
    }
    
    const job = await createDownloadJob(url, options);
    
    res.json({
      jobId: job.id,
      status: job.status,
      message: 'Download job created'
    });
  } catch (error) {
    console.error('Failed to create download job:', error);
    res.status(500).json({ 
      error: 'Failed to create download job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/download/:jobId/status - Get download status
router.get('/download/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = loadJobMetadata(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      playlistName: job.playlistInfo?.name,
      error: job.error,
      shareCode: job.status === 'completed' ? job.shareCode : undefined,
      expiresAt: job.expiresAt
    });
  } catch (error) {
    console.error('Failed to get job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// GET /api/download/:jobId/download - Download the ZIP file
router.get('/download/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = loadJobMetadata(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Download not ready' });
    }
    
    const archivePath = job.archivePath || getArchivePath(jobId);
    
    if (!archivePath) {
      return res.status(404).json({ error: 'Archive not found' });
    }
    
    const filename = `${job.playlistInfo?.name || 'download'}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.sendFile(archivePath);
  } catch (error) {
    console.error('Failed to download file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// GET /api/share/:shareCode - Get download info from share code
router.get('/share/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;
    
    const valid = await isLinkValid(shareCode);
    if (!valid) {
      return res.status(404).json({ error: 'Link expired or invalid' });
    }
    
    const linkData = await getShareLinkData(shareCode);
    if (!linkData) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const job = loadJobMetadata(linkData.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Download not found' });
    }
    
    res.json({
      jobId: job.id,
      playlistName: job.playlistInfo?.name,
      songCount: job.playlistInfo?.songs.length,
      expiresAt: new Date(linkData.expiresAt),
      downloadCount: linkData.downloadCount
    });
  } catch (error) {
    console.error('Failed to get share link:', error);
    res.status(500).json({ error: 'Failed to get share link' });
  }
});

// GET /api/share/:shareCode/download - Download from share code
router.get('/share/:shareCode/download', async (req, res) => {
  try {
    const { shareCode } = req.params;
    
    const valid = await isLinkValid(shareCode);
    if (!valid) {
      return res.status(404).json({ error: 'Link expired or invalid' });
    }
    
    const linkData = await getShareLinkData(shareCode);
    if (!linkData) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const job = loadJobMetadata(linkData.jobId);
    if (!job || !job.archivePath) {
      return res.status(404).json({ error: 'Download not found' });
    }
    
    // Increment download count
    await incrementDownloadCount(shareCode);
    
    const filename = `${job.playlistInfo?.name || 'download'}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.sendFile(job.archivePath);
  } catch (error) {
    console.error('Failed to download from share link:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
