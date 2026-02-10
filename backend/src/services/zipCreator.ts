import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { getArchivePath, getTempDir } from '../utils/storage.js';

export async function createZipArchive(jobId: string, playlistName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempDir = getTempDir(jobId);
    const archivePath = getArchivePath(jobId);
    
    // Create archive
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    output.on('close', () => {
      resolve(archivePath);
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add files from temp directory
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      archive.file(filePath, { name: file });
    }
    
    archive.finalize();
  });
}
