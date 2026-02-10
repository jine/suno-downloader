import https from 'https';
import fs from 'fs';
import path from 'path';
import { Song } from '../models/DownloadJob.js';
import { sanitizeFilename } from './sunoScraper.js';
import { config } from '../config.js';

export async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

export async function downloadSong(
  song: Song,
  outputDir: string,
  index: number
): Promise<{ success: boolean; filename: string; error?: string }> {
  const prefix = `${(index + 1).toString().padStart(2, '0')}`;
  const safeTitle = sanitizeFilename(song.title || song.id);
  const filename = `${prefix}_${safeTitle}.mp3`;
  const outputPath = path.join(outputDir, filename);
  
  try {
    await downloadFile(song.audioUrl, outputPath);
    return { success: true, filename };
  } catch (err) {
    return { 
      success: false, 
      filename,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
