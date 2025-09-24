# Scripts Directory

Build automation scripts for the MEC CLI standalone binaries and Homebrew distribution.

## Scripts

### 📦 `package-binaries.sh`
Creates standalone binaries using Node.js SEA (Single Executable Applications).
```bash
./scripts/package-binaries.sh
```
**Output**: `dist/mec-{platform}` binaries for macOS and Linux (ARM64/x64)

> **Note**: This script is optional for testing/development purposes. It is automatically executed as part of `package-homebrew.sh`.

### 📦 `package-homebrew.sh`
Packages binaries for Homebrew distribution with SHA256 hashes.
```bash
npm run package
```
**Output**: `releases/mec-{platform}` binaries + Homebrew formula snippet

### 🚀 `release.sh`
Creates git tags and prepares GitHub releases.
```bash
npm run release
```
**Output**: Git tag pushed, ready for GitHub release

## Workflow

```bash
# Package for Homebrew (includes binaries)
npm run package

# Create release tag
npm run release
```

## Requirements

- Node.js v20+ (for building)
- curl, tar (for Node.js binary downloads)
- Git (for releases)
- Console output with Homebrew formula snippet and release notes
