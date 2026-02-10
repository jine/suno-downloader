import https from 'https';
import * as cheerio from 'cheerio';
import { Song, PlaylistInfo } from '../models/DownloadJob.js';

const CDN_AUDIO_URL = 'https://cdn1.suno.ai';
const CDN_IMAGE_URL = 'https://cdn2.suno.ai';

export async function fetchHtml(url: string): Promise<string> {
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

export function extractSongsFromHtml(html: string): Song[] {
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

export function extractPlaylistInfo(html: string): PlaylistInfo {
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

export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}
