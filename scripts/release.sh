#!/bin/bash

# GitHub Release script for mec CLI
# Creates a git tag and GitHub release with standalone binaries

set -e

# Configuration
PACKAGE_NAME="mec"
DIST_DIR="releases"
PLATFORMS=("macos-arm64" "macos-x64" "linux-x64" "linux-arm64")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from package.json
VERSION=$(node -pe "require('./package.json').version")
TAG_NAME="v${VERSION}"

echo -e "${BLUE}🚀 Preparing release for ${PACKAGE_NAME} v${VERSION}${NC}"

# Check if binaries exist
echo -e "${YELLOW}🔍 Checking for release binaries...${NC}"
for platform in "${PLATFORMS[@]}"; do
    binary_path="${DIST_DIR}/mec-${platform}.tgz"
    if [ ! -f "$binary_path" ]; then
        echo -e "${RED}❌ Binary not found: ${binary_path}${NC}"
        echo -e "${YELLOW}💡 Run 'npm run package' first${NC}"
        exit 1
    fi
done

# Check if git tag already exists
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${RED}❌ Tag ${TAG_NAME} already exists${NC}"
    echo -e "${YELLOW}💡 Update version in package.json or delete existing tag${NC}"
    exit 1
fi

# Create git tag
echo -e "${YELLOW}🏷️  Creating git tag: ${TAG_NAME}${NC}"
git tag -a "$TAG_NAME" -m "Release version ${VERSION}"

# Push tag to remote
echo -e "${YELLOW}📤 Pushing tag to remote${NC}"
git push origin "$TAG_NAME"

echo -e "${GREEN}✅ Release ${TAG_NAME} created and pushed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Go to: https://github.com/medallia/mec-cli/releases/new?tag=${TAG_NAME}"
echo -e "  2. Upload these .tgz compressed binaries:"
for platform in "${PLATFORMS[@]}"; do
    echo -e "     • ${DIST_DIR}/mec-${platform}.tgz"
done
echo -e "  3. Write release notes"
echo -e "  4. Publish the release"

echo -e "\n${GREEN}🎉 Release ${TAG_NAME} is ready!${NC}"
