#!/bin/bash

# Binary packaging script for mec CLI using Node.js SEA (Single Executable Applications)
# Creates standalone binaries for multiple platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="24.8.0"
PLATFORMS=("macos-arm64" "macos-x64" "linux-x64" "linux-arm64")
DIST_DIR="dist"
TEMP_DIR="temp-node-binaries"

echo -e "${BLUE}🔨 Building TypeScript...${NC}"
npm run build

echo -e "${BLUE}📦 Bundling application...${NC}"
npx esbuild bin/mec.ts --bundle --platform=node --format=cjs --target=node20 \
  --outfile=dist/bin/mec-bundled.js \
  --define:import.meta.url='"file://"' \
  --external:fsevents

echo -e "${BLUE}🏗️ Creating standalone binaries (no Node.js required for users)...${NC}"

# Create sea-config.json
cat > sea-config.json << EOF
{
  "main": "dist/bin/mec-bundled.js",
  "output": "sea-prep.blob",
  "disableExperimentalSEAWarning": true
}
EOF

# Generate the blob
echo -e "${YELLOW}Generating SEA blob...${NC}"
node --experimental-sea-config sea-config.json

# Create temp directory for Node.js binaries
mkdir -p "$TEMP_DIR"

# Function to download and extract Node.js binary
download_node() {
    local platform=$1
    local node_platform=""
    local node_arch=""
    local extension="tar.gz"
    
    case $platform in
        "macos-arm64")
            node_platform="darwin"
            node_arch="arm64"
            ;;
        "macos-x64")
            node_platform="darwin"
            node_arch="x64"
            ;;
        "linux-x64")
            node_platform="linux"
            node_arch="x64"
            ;;
        "linux-arm64")
            node_platform="linux"
            node_arch="arm64"
            ;;
    esac
    
    local url="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${node_platform}-${node_arch}.${extension}"
    local filename="node-v${NODE_VERSION}-${node_platform}-${node_arch}.${extension}"
    local extract_dir="${TEMP_DIR}/node-v${NODE_VERSION}-${node_platform}-${node_arch}"
    
    echo -e "${YELLOW}  Downloading Node.js v${NODE_VERSION} for ${platform}...${NC}" >&2
    curl -s -L -o "${TEMP_DIR}/${filename}" "$url"
    
    echo -e "${YELLOW}  Extracting...${NC}" >&2
    tar -xzf "${TEMP_DIR}/${filename}" -C "$TEMP_DIR"
    
    # Return the path to the node binary to stdout
    echo "${extract_dir}/bin/node"
}

# Function to inject SEA and create binary
create_binary() {
    local platform=$1
    local node_binary=$2
    local output_binary="${DIST_DIR}/mec-${platform}"
    
    echo -e "${YELLOW}Building for ${platform}...${NC}"
    
    # Copy node binary to output location
    cp "$node_binary" "$output_binary"
    
    # Inject the SEA blob (postject outputs its own messages)
    npx postject "$output_binary" NODE_SEA_BLOB sea-prep.blob \
        --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
        --macho-segment-name NODE_SEA 2>/dev/null || true
    
    echo -e "${GREEN}  ✅ Created ${output_binary}${NC}"
}

# Create binaries for all platforms
for platform in "${PLATFORMS[@]}"; do
    node_binary=$(download_node "$platform")
    create_binary "$platform" "$node_binary"
done

# Cleanup
rm -rf "$TEMP_DIR"
rm -f sea-config.json sea-prep.blob

echo -e "${GREEN}✅ Standalone binaries created! Users do NOT need Node.js installed!${NC}"
echo -e "${GREEN}📍 Location: ${DIST_DIR}/mec-*${NC}"

# Show file sizes
echo -e "\n${BLUE}📊 Binary sizes:${NC}"
ls -lh "${DIST_DIR}"/mec-* | awk '{print "  " $9 ": " $5}'