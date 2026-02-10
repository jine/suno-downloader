import fs from 'fs';
import path from 'path';
import https from 'https';
import { Command } from 'commander';
import * as cheerio from 'cheerio';
import chalk from 'chalk';
import ora from 'ora';

interface Song {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
}

interface PlaylistInfo {
  name: string;
  creator: string;
  description?: string;
  songs: Song[];
}

const CDN_AUDIO_URL = 'https://cdn1.suno.ai';
const CDN_IMAGE_URL = 'https://cdn2.suno.ai';

async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractSongsFromHtml(html: string): Song[] {
  const $ = cheerio.load(html);
  const songs: Song[] = [];
  const seenIds = new Set<string>();
  
  // Method 1: Extract from Open Graph meta tags
  $('meta[property="og:audio"]').each((_, elem) => {
    const audioUrl = $(elem).attr('content');
    if (audioUrl) {
      const match = audioUrl.match(/cdn1\.suno\.ai\/([a-f0-9-]+)\.mp3/);
      if (match && match[1] && !seenIds.has(match[1])) {
        const id = match[1];
        seenIds.add(id);
        songs.push({
          id,
          title: '',
          audioUrl: `${CDN_AUDIO_URL}/${id}.mp3`,
          imageUrl: `${CDN_IMAGE_URL}/image_${id}.jpeg`
        });
      }
    }
  });
  
  // Method 2: Extract from data-clip-id attributes
  $('[data-clip-id]').each((_, elem) => {
    const id = $(elem).attr('data-clip-id');
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      
      // Try to find song title
      let title = '';
      const titleElem = $(elem).find('[data-testid="song-title"], .song-title, h3, h4').first();
      if (titleElem.length) {
        title = titleElem.text().trim();
      }
      
      songs.push({
        id,
        title,
        audioUrl: `${CDN_AUDIO_URL}/${id}.mp3`,
        imageUrl: `${CDN_IMAGE_URL}/image_${id}.jpeg`
      });
    }
  });
  
  // Method 3: Extract from Twitter player meta
  $('meta[name="twitter:player:stream"]').each((_, elem) => {
    const audioUrl = $(elem).attr('content');
    if (audioUrl) {
      const match = audioUrl.match(/cdn1\.suno\.ai\/([a-f0-9-]+)\.mp3/);
      if (match && match[1] && !seenIds.has(match[1])) {
        const id = match[1];
        seenIds.add(id);
        songs.push({
          id,
          title: '',
          audioUrl: `${CDN_AUDIO_URL}/${id}.mp3`,
          imageUrl: `${CDN_IMAGE_URL}/image_${id}.jpeg`
        });
      }
    }
  });
  
  // Extract song titles from links
  songs.forEach(song => {
    if (!song.title) {
      const link = $(`a[href*="/song/${song.id}"]`);
      if (link.length) {
        song.title = link.text().trim();
      }
    }
  });
  
  return songs;
}

function extractPlaylistInfo(html: string): PlaylistInfo {
  const $ = cheerio.load(html);
  
  const name = $('h1').first().text().trim() || 
               $('meta[property="og:title"]').attr('content') || 
               'Unknown Playlist';
  
  const creator = $('meta[property="og:description"]').attr('content') || '';
  const description = $('meta[name="description"]').attr('content') || '';
  
  const songs = extractSongsFromHtml(html);
  
  return {
    name,
    creator,
    description,
    songs
  };
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
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

async function downloadSongs(
  playlistInfo: PlaylistInfo, 
  outputDir: string,
  options: { images?: boolean; } = {}
): Promise<{ success: number; failed: number }> {
  // Create output directory
  const safeName = sanitizeFilename(playlistInfo.name);
  const downloadDir = path.join(outputDir, safeName);
  
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  
  let success = 0;
  let failed = 0;
  
  console.log(chalk.blue(`\n📁 Downloading to: ${downloadDir}`));
  console.log(chalk.blue(`🎵 Found ${playlistInfo.songs.length} songs\n`));
  
  for (let i = 0; i < playlistInfo.songs.length; i++) {
    const song = playlistInfo.songs[i]!;
    const prefix = `${(i + 1).toString().padStart(2, '0')}`;
    const safeTitle = sanitizeFilename(song.title || song.id);
    const filename = `${prefix}_${safeTitle}.mp3`;
    const outputPath = path.join(downloadDir, filename);
    
    const spinner = ora(`Downloading: ${song.title || song.id}`).start();
    
    try {
      await downloadFile(song.audioUrl, outputPath);
      spinner.succeed(chalk.green(`Downloaded: ${filename}`));
      success++;
      
      // Download image if requested
      if (options.images && song.imageUrl) {
        const imageFilename = `${prefix}_${safeTitle}_cover.jpg`;
        const imagePath = path.join(downloadDir, imageFilename);
        try {
          await downloadFile(song.imageUrl, imagePath);
        } catch (err) {
          // Ignore image download errors
        }
      }
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${song.title || song.id}`));
      failed++;
    }
  }
  
  return { success, failed };
}

async function main() {
  const program = new Command();
  
  program
    .name('suno-downloader')
    .description('Download songs from Suno AI playlists and profiles')
    .version('1.0.0')
    .argument('<url>', 'Suno playlist or profile URL')
    .option('-o, --output <dir>', 'Output directory', './downloads')
    .option('-i, --images', 'Download cover images as well', false)
    .action(async (url: string, options) => {
      try {
        console.log(chalk.cyan('🎵 Suno Downloader\n'));
        console.log(chalk.gray(`Fetching: ${url}`));
        
        const html = await fetchHtml(url);
        const playlistInfo = extractPlaylistInfo(html);
        
        console.log(chalk.yellow(`\n📀 ${playlistInfo.name}`));
        if (playlistInfo.creator) {
          console.log(chalk.gray(`by ${playlistInfo.creator}`));
        }
        
        const results = await downloadSongs(playlistInfo, options.output, {
          images: options.images
        });
        
        console.log(chalk.green(`\n✅ Download complete!`));
        console.log(chalk.gray(`   Success: ${results.success}`));
        if (results.failed > 0) {
          console.log(chalk.red(`   Failed: ${results.failed}`));
        }
        
      } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
  
  program.parse();
}

main();
