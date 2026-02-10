# Contributing to Suno Downloader

First off, thank you for considering contributing to Suno Downloader! It's people like you that make this tool better for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include the URL you were trying to download from**
- **Include your Node.js version and operating system**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` for your feature or bug fix
3. Make your changes
4. Ensure your code follows the existing code style
5. Test your changes manually
6. Update documentation if needed
7. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/suno-downloader.git
cd suno-downloader

# Install dependencies
npm install

# Build the project
npx tsc

# Test your changes
node dist/index.js <test-url>
```

## Code Style

- Use TypeScript strict mode
- Follow the existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Use Chalk for colored console output
- Use Ora for loading indicators

## Testing

Currently, this project uses manual testing:

1. Find a public Suno URL (playlist, profile, or song)
2. Run the downloader
3. Verify files are downloaded correctly
4. Check that metadata is preserved
5. Test with different options (-o, -i)

## Documentation

- Update README.md if you change functionality
- Update AGENTS.md for developer-related changes
- Update docs/ folder for GitHub Pages documentation

## Commit Messages

Use clear and meaningful commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎵
