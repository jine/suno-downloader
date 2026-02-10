# Suno Downloader

<div align="center">

🎵 **Download music from Suno AI with ease**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[Features](#features) • [CLI](#cli-tool) • [Web-App](#web-application) • [API](#api) • [Docker](#docker-deployment)

</div>

## Features

- 🌐 **Full-Stack Web Application** - React frontend with Express backend
- 📦 **ZIP Downloads** - Automatically packages songs into downloadable archives
- 🔗 **Shareable Links** - Generate expiring links to share downloads (24h default)
- 📊 **Real-time Progress** - Live progress tracking in the web UI
- 🐳 **Docker Ready** - Complete docker-compose setup for easy deployment
- 🎵 **CLI Tool** - Command-line interface for power users
- 📋 **Playlist Support** - Download complete playlists or user profiles
- 🖼️ **Cover Art** - Optional cover image downloads
- 🏷️ **Metadata Preservation** - Song titles, playlist names preserved

## Quick Start

### Docker (Recommended)

```bash
# Clone and start everything
git clone https://github.com/jine/suno-downloader.git
cd suno-downloader
docker-compose up -d

# Access the app at http://localhost
```

### Manual Setup

**Requirements:**
- Node.js 18+
- Redis (for job queue)

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Terminal 1 - Start Backend
cd backend && npm run dev

# Terminal 2 - Start Frontend
cd frontend && npm run dev

# Access at http://localhost:5173
```

## Web Application

### Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   React      │──────│   Express    │──────│    Redis     │
│   Frontend   │      │   Backend    │      │   (Queue)    │
└──────────────┘      └──────┬───────┘      └──────────────┘
                             │
                      ┌──────┴───────┐      ┌──────────────┐
                      │   Storage    │──────│     S3       │
                      │   (ZIPs)     │      │  (Optional)  │
                      └──────────────┘      └──────────────┘
```

### Usage

1. Open the web app in your browser
2. Paste a Suno playlist or profile URL
3. Click "Download" and wait for processing
4. Download the ZIP file or copy the shareable link

### Shareable Links

- Links expire after 24 hours (configurable)
- 8-character unique codes (e.g., `a1b2c3d4`)
- Direct download via `/share/:code`
- Automatic cleanup of expired files

## CLI Tool

For command-line usage:

```bash
cd cli
npm install
npm run build

# Download a playlist
node dist/index.js "https://suno.com/playlist/abc123"

# Download with images
node dist/index.js "https://suno.com/@username" -i
```

## API

### Endpoints

**Start Download**
```bash
POST /api/download
Content-Type: application/json

{
  "url": "https://suno.com/playlist/abc123",
  "options": {
    "includeImages": false
  }
}

# Response
{
  "jobId": "uuid",
  "status": "queued"
}
```

**Check Status**
```bash
GET /api/download/:jobId/status

# Response
{
  "jobId": "uuid",
  "status": "processing",
  "progress": {
    "total": 24,
    "completed": 12,
    "failed": 0,
    "currentSong": "Song Title"
  }
}
```

**Download ZIP**
```bash
GET /api/download/:jobId/download
# Returns ZIP file
```

**Shareable Link**
```bash
GET /api/share/:shareCode
# Returns download info or redirects to download
```

## Docker Deployment

### Production

```bash
# Start all services
docker-compose up -d

# Services:
# - Frontend: http://localhost (nginx)
# - Backend API: http://localhost:3000
# - Redis: localhost:6379
# - Storage: ./storage (persistent volume)
```

### Environment Variables

Create `backend/.env`:

```bash
# Server
PORT=3000
NODE_ENV=production

# Redis
REDIS_URL=redis://redis:6379

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./storage

# Links
LINK_EXPIRY_HOURS=24
MAX_DOWNLOADS_PER_LINK=0

# Cleanup
CLEANUP_INTERVAL_MINUTES=60
MAX_FILE_AGE_HOURS=48
```

## Project Structure

```
suno-downloader/
├── backend/              # Express API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── queue/        # Bull job queue
│   │   └── utils/        # Storage & cleanup
│   └── Dockerfile
├── frontend/             # React app
│   ├── src/
│   └── Dockerfile
├── cli/                  # CLI tool
│   └── src/
├── docker-compose.yml    # Full stack deployment
└── README.md
```

## Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | API server port |
| `REDIS_URL` | redis://localhost:6379 | Redis connection |
| `STORAGE_TYPE` | local | Storage backend (local/s3) |
| `LINK_EXPIRY_HOURS` | 24 | Shareable link lifetime |
| `MAX_FILE_AGE_HOURS` | 48 | Auto-cleanup threshold |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | '' | Backend API URL |

## Development

### Backend

```bash
cd backend
npm install
npm run dev        # Development with hot reload
npm run build      # Production build
npm start          # Run production build
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build
```

### CLI

```bash
cd cli
npm install
npm run build
node dist/index.js <url>
```

## How It Works

1. **URL Submission** - User submits Suno URL via web UI or CLI
2. **Scraping** - Backend fetches Suno page and extracts song IDs
3. **Queue** - Download job added to Redis/Bull queue
4. **Processing** - Worker downloads each song from Suno's CDN
5. **Archiving** - Songs packaged into ZIP file
6. **Link Generation** - Shareable link created with nanoid
7. **Download** - User downloads ZIP or shares link
8. **Cleanup** - Expired files automatically removed

## Supported URLs

- **Playlists**: `https://suno.com/playlist/*`
- **Profiles**: `https://suno.com/@username`
- **Songs**: `https://suno.com/song/*`

## Tech Stack

- **Backend**: Express.js, TypeScript, Bull, Redis, Cheerio
- **Frontend**: React 19, Vite, TypeScript, React Query
- **CLI**: Commander.js, Chalk, Ora
- **Infrastructure**: Docker, Docker Compose
- **Storage**: Local filesystem or AWS S3

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## Security

- URL validation (only suno.com domains)
- Rate limiting support
- File size limits
- Filename sanitization
- HTTPS only
- CORS configured

## License

ISC License - see [LICENSE](LICENSE)

## Disclaimer

This tool is for educational purposes. Please respect Suno's Terms of Service and only download content you have permission to access.

---

Made with ❤️ by [jine](https://github.com/jine)
