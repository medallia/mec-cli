#!/bin/bash

# Homebrew packaging script for mec CLI
# This script creates standalone binaries and prepares them for Homebrew distribution

set -e

# Configuration
PACKAGE_NAME="mec"
DIST_DIR="releases"
BUILD_DIR="dist"
VERSION=$(node -pe "require('./package.json').version")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Homebrew package build for v${VERSION}...${NC}"

# Check for uncommitted changes
echo -e "${YELLOW}🔍 Checking for uncommitted changes...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Uncommitted changes detected!${NC}"
    echo -e "${YELLOW}💡 Please commit or stash your changes before packaging${NC}"
    echo -e "${YELLOW}   Use: git status to see changes${NC}"
    exit 1
fi

# Create releases directory if it doesn't exist
mkdir -p ${DIST_DIR}

# Build standalone binaries
echo -e "${BLUE}🔨 Building standalone binaries...${NC}"
./scripts/package-binaries.sh

# Verify binaries were created
PLATFORMS=("macos-arm64" "macos-x64" "linux-x64" "linux-arm64")
for platform in "${PLATFORMS[@]}"; do
    binary_path="${BUILD_DIR}/mec-${platform}"
    if [ ! -f "$binary_path" ]; then
        echo -e "${RED}❌ Binary creation failed: ${binary_path} not found${NC}"
        exit 1
    fi
done

# Copy binaries to releases directory and generate SHA256 hashes
echo -e "${YELLOW}📦 Copying binaries and generating SHA256 hashes...${NC}"

# Store hashes in temporary files (compatible with older bash)
HASH_DIR=$(mktemp -d)

for platform in "${PLATFORMS[@]}"; do
    src_binary="${BUILD_DIR}/mec-${platform}"
    dest_binary="${DIST_DIR}/mec-${platform}"
    
    cp "$src_binary" "$dest_binary"
    hash=$(shasum -a 256 "$dest_binary" | cut -d' ' -f1)
    echo "$hash" > "${HASH_DIR}/${platform}"
    
    echo -e "${GREEN}  ✅ ${platform}: ${hash}${NC}"
done

echo -e "${GREEN}✅ Binaries packaged successfully!${NC}"

# Display Homebrew formula information
echo -e "\n${YELLOW}📋 Homebrew Formula URLs and SHA256 hashes:${NC}"
echo -e "${BLUE}# Update your Homebrew formula with these values after release:${NC}"
echo ""

for platform in "${PLATFORMS[@]}"; do
    hash=$(cat "${HASH_DIR}/${platform}")
    case $platform in
        "macos-arm64")
            echo ""
            echo "on_macos do"
            echo "  # macOS ARM64"
            echo "  if Hardware::CPU.arm?"
            echo "    url \"https://github.com/medallia/mec-cli/releases/download/v${VERSION}/mec-${platform}\""
            echo "    sha256 \"${hash}\""
            ;;
        "macos-x64")
            echo "  # macOS x64"
            echo "  else"
            echo "    url \"https://github.com/medallia/mec-cli/releases/download/v${VERSION}/mec-${platform}\""
            echo "    sha256 \"${hash}\""
            echo "  end"
            ;;
        "linux-x64")
            echo ""
            echo "on_linux do"
            echo "  # Linux x64"
            echo "  if Hardware::CPU.intel?"
            echo "    url \"https://github.com/medallia/mec-cli/releases/download/v${VERSION}/mec-${platform}\""
            echo "    sha256 \"${hash}\""
            ;;
        "linux-arm64")
            echo "  # Linux ARM64"
            echo "  else"
            echo "    url \"https://github.com/medallia/mec-cli/releases/download/v${VERSION}/mec-${platform}\""
            echo "    sha256 \"${hash}\""
            echo "  end"
            echo "end"
            ;;
    esac
done

# Clean up temporary hash files
rm -rf "${HASH_DIR}"

echo ""
echo -e "${YELLOW}📦 Files ready for GitHub release:${NC}"
for platform in "${PLATFORMS[@]}"; do
    echo -e "${GREEN}  📄 ${DIST_DIR}/mec-${platform}${NC}"
done

echo -e "\n${GREEN}🎉 Ready for Homebrew distribution!${NC}"
