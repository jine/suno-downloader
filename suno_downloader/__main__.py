"""CLI entry point."""

import argparse
import sys

from .downloader import SunoDownloader


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="Download music from Suno AI")
    parser.add_argument("url", help="URL of the Suno track to download")
    parser.add_argument("-o", "--output", default="downloads", help="Output directory")
    
    args = parser.parse_args()
    
    downloader = SunoDownloader()
    downloader.download(args.url, args.output)


if __name__ == "__main__":
    main()
