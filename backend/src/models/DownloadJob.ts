export interface Song {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
}

export interface PlaylistInfo {
  name: string;
  creator: string;
  description?: string;
  songs: Song[];
}

export interface DownloadJob {
  id: string;
  url: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
    currentSong?: string;
  };
  playlistInfo?: PlaylistInfo;
  archivePath?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  shareCode?: string;
  expiresAt?: Date;
}

export interface DownloadOptions {
  includeImages?: boolean;
}
