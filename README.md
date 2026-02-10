# Suno Downloader

<div align="center">

🎵 **Download music from Suno AI with ease**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Documentation](https://jine.github.io/suno-downloader)

</div>

## Features

- 🎵 **Download individual tracks** from Suno AI
- 📋 **Download complete playlists** with a single command
- 🖼️ **Optional cover art** downloads
- 🏷️ **Metadata preservation** (song titles, playlist names)
- 📁 **Organized file naming** with numbered prefixes
- ✨ **Beautiful CLI interface** with progress indicators
- 🔧 **TypeScript support** for type safety

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Install from Source

```bash
# Clone the repository
git clone https://github.com/jine/suno-downloader.git
cd suno-downloader

# Install dependencies
npm install

# Build the TypeScript code
npx tsc
```

## Usage

### Basic Usage

Download songs from a Suno playlist or profile URL:

```bash
node dist/index.js <suno-url>
```

### Options

```
Options:
  -V, --version          output the version number
  -o, --output <dir>     Output directory (default: "./downloads")
  -i, --images           Download cover images as well (default: false)
  -h, --help            display help for command
```

### Examples

```bash
# Download playlist to default directory
node dist/index.js "https://suno.com/playlist/abc123"

# Download to custom directory with cover images
node dist/index.js "https://suno.com/@username" -o ./my-music -i

# Download single song
node dist/index.js "https://suno.com/song/xyz789"
```

## Output Structure

Files are organized in numbered format with sanitized filenames:

```
downloads/
└── Playlist_Name/
    ├── 01_Song_Title.mp3
    ├── 01_Song_Title_cover.jpg
    ├── 02_Another_Song.mp3
    └── 02_Another_Song_cover.jpg
```

## Technical Details

### How It Works

1. **URL Parsing**: Extracts the Suno playlist/profile URL
2. **HTML Fetching**: Retrieves the page content via HTTPS
3. **Content Extraction**: Uses Cheerio to parse HTML and extract:
   - Song IDs from `data-clip-id` attributes
   - Audio URLs from Open Graph meta tags
   - Song titles from page elements
   - Cover images from CDN
4. **Download**: Streams audio files from Suno's CDN
5. **Organization**: Saves files with numbered prefixes for proper sorting

### Supported URL Patterns

- Playlists: `https://suno.com/playlist/*`
- User profiles: `https://suno.com/@username`
- Individual songs: `https://suno.com/song/*`

## Development

```bash
# Install dependencies
npm install

# Build
npx tsc

# Run
node dist/index.js <url>
```

## Dependencies

- [commander](https://www.npmjs.com/package/commander) - CLI framework
- [cheerio](https://www.npmjs.com/package/cheerio) - Server-side HTML parsing
- [chalk](https://www.npmjs.com/package/chalk) - Terminal styling
- [ora](https://www.npmjs.com/package/ora) - Loading spinners

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Disclaimer

This tool is for educational purposes only. Please respect Suno's Terms of Service and only download content you have permission to access. The authors are not responsible for any misuse of this tool.

## Support

- 📧 Report bugs: [GitHub Issues](https://github.com/jine/suno-downloader/issues)
- 📖 Documentation: [GitHub Pages](https://jine.github.io/suno-downloader)

---

Made with ❤️ by [jine](https://github.com/jine)
