#!/bin/bash

# Homebrew packaging script for mec CLI
# This script creates a tarball suitable for Homebrew formula

set -e

# Configuration
PACKAGE_NAME="mec"
DIST_DIR="releases"
BUILD_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Homebrew package build...${NC}"

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

# Clean and build
echo -e "${YELLOW}📦 Building project...${NC}"
npm run build

# Verify build output exists
if [ ! -f "${BUILD_DIR}/bin/mec.js" ]; then
    echo -e "${RED}❌ Build failed: ${BUILD_DIR}/bin/mec.js not found${NC}"
    exit 1
fi

# Create npm package
echo -e "${YELLOW}📦 Creating npm package...${NC}"
npm pack

# Get the generated tarball name
TARBALL=$(ls ${PACKAGE_NAME}-*.tgz | head -1)

if [ ! -f "$TARBALL" ]; then
    echo -e "${RED}❌ Package creation failed: tarball not found${NC}"
    exit 1
fi

# Move tarball to releases directory
mv "$TARBALL" "${DIST_DIR}/"
FINAL_TARBALL="${DIST_DIR}/${TARBALL}"

echo -e "${GREEN}✅ Package created successfully!${NC}"
echo -e "${GREEN}📍 Location: ${FINAL_TARBALL}${NC}"

# Generate SHA256 for Homebrew formula
SHA256=$(shasum -a 256 "${FINAL_TARBALL}" | cut -d' ' -f1)
echo -e "${GREEN}🔐 SHA256: ${SHA256}${NC}"

# Display Homebrew formula snippet
echo -e "\n${YELLOW}📋 Homebrew Formula snippet:${NC}"
VERSION=$(node -pe "require('./package.json').version")
echo "  url \"https://github.com/medallia/mec-cli/releases/download/v${VERSION}/${TARBALL}\""
echo "  sha256 \"${SHA256}\""

echo -e "\n${GREEN}🎉 Ready for Homebrew distribution!${NC}"
