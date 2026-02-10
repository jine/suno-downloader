import { nanoid } from 'nanoid';
import { Redis } from 'ioredis';
import { config } from '../config.js';

const redis = new Redis(config.redisUrl);

export interface ShareLinkData {
  jobId: string;
  expiresAt: number;
  downloadCount: number;
  maxDownloads: number;
}

export async function createShareLink(jobId: string): Promise<string> {
  const shareCode = nanoid(8);
  const expiresAt = Date.now() + (config.linkExpiryHours * 60 * 60 * 1000);
  
  const data: ShareLinkData = {
    jobId,
    expiresAt,
    downloadCount: 0,
    maxDownloads: config.maxDownloadsPerLink
  };
  
  await redis.setex(
    `share:${shareCode}`,
    config.linkExpiryHours * 60 * 60,
    JSON.stringify(data)
  );
  
  return shareCode;
}

export async function getShareLinkData(shareCode: string): Promise<ShareLinkData | null> {
  const data = await redis.get(`share:${shareCode}`);
  if (!data) return null;
  
  return JSON.parse(data) as ShareLinkData;
}

export async function incrementDownloadCount(shareCode: string): Promise<void> {
  const data = await getShareLinkData(shareCode);
  if (data) {
    data.downloadCount++;
    await redis.setex(
      `share:${shareCode}`,
      Math.floor((data.expiresAt - Date.now()) / 1000),
      JSON.stringify(data)
    );
  }
}

export async function isLinkValid(shareCode: string): Promise<boolean> {
  const data = await getShareLinkData(shareCode);
  if (!data) return false;
  
  if (Date.now() > data.expiresAt) return false;
  
  if (data.maxDownloads > 0 && data.downloadCount >= data.maxDownloads) {
    return false;
  }
  
  return true;
}

export async function deleteShareLink(shareCode: string): Promise<void> {
  await redis.del(`share:${shareCode}`);
}
