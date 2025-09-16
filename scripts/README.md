# Scripts Directory

This directory contains automation scripts for building, packaging, and releasing the MEC CLI.

## Scripts Overview

### 📦 `package-homebrew.sh`
**Purpose**: Creates npm tarball for Homebrew distribution
**Usage**: `npm run package`

What it does:
1. Builds the TypeScript project (`npm run build`)
2. Creates npm package (`npm pack`)
3. Moves tarball to `releases/` directory
4. Generates SHA256 hash for security
5. Outputs Homebrew formula snippet

**Output**: `releases/mec-{version}.tgz` ready for Homebrew

### 🚀 `release.sh`
**Purpose**: Creates git tags and prepares GitHub releases
**Usage**: `npm run release`

What it does:
1. Checks if package tarball exists (requires `package-homebrew.sh` first)
2. Creates git tag (`v{version}`)
3. Pushes tag to remote repository
4. Provides GitHub release instructions

**Output**: Git tag created, ready for GitHub release

## Workflow

```bash
# Step 1: Package the CLI
npm run package

# Step 2: Create release (optional)
npm run release
```

## Requirements

- **Node.js**: For building and version detection
- **Git**: For tagging and pushing (release script only)
- **shasum**: For generating SHA256 hashes (usually pre-installed)

## Outputs Generated

- `releases/mec-{version}.tgz` - Distribution package
- Git tag `v{version}` - For GitHub releases
- Console output with Homebrew formula snippet and release notes
