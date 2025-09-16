#!/bin/bash

# GitHub Release script for mec CLI
# Creates a git tag and GitHub release with the packaged tarball

set -e

# Configuration
PACKAGE_NAME="mec"
DIST_DIR="releases"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from package.json
VERSION=$(node -pe "require('./package.json').version")
TAG_NAME="v${VERSION}"
TARBALL="${PACKAGE_NAME}-${VERSION}.tgz"
TARBALL_PATH="${DIST_DIR}/${TARBALL}"

echo -e "${BLUE}🚀 Preparing release for ${PACKAGE_NAME} v${VERSION}${NC}"

# Check if tarball exists
if [ ! -f "$TARBALL_PATH" ]; then
    echo -e "${RED}❌ Tarball not found: ${TARBALL_PATH}${NC}"
    echo -e "${YELLOW}💡 Run 'npm run package' first${NC}"
    exit 1
fi

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
echo -e "  2. Upload: ${TARBALL_PATH}"
echo -e "  3. Write custom release notes"
echo -e "  4. Publish the release"

echo -e "\n${GREEN}🎉 Release ${TAG_NAME} is ready!${NC}"
