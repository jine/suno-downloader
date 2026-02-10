# AGENTS.md

## Project Instructions

### Project Overview
**Suno Downloader** - Full-stack web application for downloading music from Suno AI with a web interface.

**Current Status:** CLI tool complete, Web app architecture planned

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│   File Storage  │
│  (React/Vue)    │     │   (Express.js)   │     │   (Local/S3)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Download Queue  │
                        │   (Bull/Redis)   │
                        └──────────────────┘
```

### Tech Stack

**Backend:**
- TypeScript 5.9+
- Node.js 18+
- Express.js (REST API)
- Cheerio (HTML parsing)
- Bull + Redis (job queue)
- Archiver (ZIP creation)
- UUID + nanoid (link generation)
- node-cron (cleanup jobs)

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS
- Axios (HTTP client)
- React Query (data fetching)

**Storage:**
- Local filesystem (dev)
- AWS S3 (production)
- Redis (job queue + metadata)

### Project Structure (Web App)

```
suno-downloader/
├── backend/
│   ├── src/
│   │   ├── server.ts           # Express server setup
│   │   ├── routes/
│   │   │   ├── download.ts     # Download API endpoints
│   │   │   └── status.ts       # Job status endpoints
│   │   ├── services/
│   │   │   ├── sunoScraper.ts  # Extract songs from Suno
│   │   │   ├── downloader.ts   # Download songs to storage
│   │   │   ├── zipCreator.ts   # Create ZIP archives
│   │   │   └── linkManager.ts  # Generate/manage shareable links
│   │   ├── queue/
│   │   │   └── downloadQueue.ts # Bull queue setup
│   │   ├── models/
│   │   │   └── DownloadJob.ts  # Job data structures
│   │   └── utils/
│   │       ├── storage.ts      # File storage abstraction
│   │       └── cleanup.ts      # Expired file cleanup
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UrlInput.tsx
│   │   │   ├── DownloadProgress.tsx
│   │   │   └── DownloadLink.tsx
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   ├── hooks/
│   │   │   └── useDownload.ts
│   │   └── App.tsx
│   ├── package.json
│   └── index.html
├── cli/                        # Original CLI tool
│   └── src/
│       └── index.ts
└── docker-compose.yml          # Redis + backend + frontend
```

### API Endpoints

```typescript
// POST /api/download
// Start a new download job
{
  "url": "https://suno.com/playlist/...",
  "options": {
    "includeImages": false
  }
}
// Response: { "jobId": "uuid", "status": "queued" }

// GET /api/download/:jobId/status
// Check download progress
{
  "jobId": "uuid",
  "status": "processing|completed|failed",
  "progress": {
    "total": 24,
    "completed": 12,
    "failed": 0
  }
}

// GET /api/download/:jobId/download
// Download the ZIP file (when completed)
// Response: ZIP file stream

// GET /api/share/:shortCode
// Access shared download link
// Redirects to download or shows download page
```

### Download Flow

1. **User submits URL** via frontend
2. **Backend scrapes** Suno page for song list
3. **Job queued** in Redis/Bull
4. **Worker downloads** each song to temp storage
5. **ZIP archive created** when all songs downloaded
6. **Shareable link generated** (nanoid: 8-10 chars)
7. **User gets link** (valid for X hours, e.g., 24h)
8. **Cleanup job** deletes expired files

### File Storage Strategy

```
storage/
├── temp/
│   └── {jobId}/              # Temporary download folder
│       ├── song1.mp3
│       ├── song2.mp3
│       └── ...
├── archives/
│   └── {jobId}.zip           # Final ZIP file
└── metadata/
    └── {jobId}.json          # Job metadata (creation time, expiry)
```

### Shareable Link System

- **Short code:** nanoid(8) → e.g., "a1b2c3d4"
- **Link format:** `https://yoursite.com/d/a1b2c3d4`
- **Expiry:** Configurable (default: 24 hours)
- **Storage:** Redis hash: `download:{shortCode} → {jobId, expiry, downloadCount}`

### Configuration

```typescript
// config.ts
interface Config {
  // Server
  port: number;
  corsOrigins: string[];
  
  // Storage
  storageType: 'local' | 's3';
  storagePath: string;  // for local
  s3Bucket?: string;    // for S3
  
  // Downloads
  maxConcurrentDownloads: number;
  downloadTimeout: number;  // ms
  
  // Links
  linkExpiryHours: number;
  maxDownloadsPerLink: number;  // 0 = unlimited
  
  // Cleanup
  cleanupIntervalMinutes: number;
}
```

### Security Considerations

- Rate limiting per IP (e.g., 10 downloads/hour)
- URL validation (only suno.com domains)
- File size limits per download
- ZIP bomb protection
- Sanitize all filenames
- HTTPS only
- CORS configuration
- No authentication required (public tool)

### Deployment Options

**Option 1: Self-Hosted (Simple)**
- Single VPS
- Docker Compose: Redis + Node backend + Nginx
- Local filesystem storage
- PM2 for process management

**Option 2: Serverless (Scalable)**
- AWS Lambda (API)
- AWS S3 (storage)
- AWS SQS (queue)
- CloudFront (CDN)

**Option 3: VPS + Cloud Storage**
- VPS for backend
- Redis Cloud or AWS ElastiCache
- S3 for file storage
- CloudFlare for CDN

### Development Commands

```bash
# Install all dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev

# Terminal 3 - Redis
docker run -p 6379:6379 redis:alpine
```

### Environment Variables

```bash
# Backend
PORT=3000
REDIS_URL=redis://localhost:6379
STORAGE_TYPE=local
STORAGE_PATH=./storage
LINK_EXPIRY_HOURS=24
MAX_CONCURRENT_DOWNLOADS=5

# Optional: AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=

# Frontend
VITE_API_URL=http://localhost:3000
```

### Original CLI Tool

The CLI tool in `/cli/` directory remains functional and can be used independently.

```bash
cd cli
npm install
npm run build
node dist/index.js <url>
```

### Migration Notes

The core download logic from CLI (`extractSongsFromHtml`, `downloadFile`) should be extracted into `backend/src/services/sunoScraper.ts` and `backend/src/services/downloader.ts` for reuse.
