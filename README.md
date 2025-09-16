# MEC CLI

**MEC** (Medallia Experience Cloud) - A command-line tool to interact with Medallia Experience Cloud services.

## Quick Start

### Installation
```bash
# Clone and build
git clone https://github.com/medallia/mec-cli
cd mec-cli
npm install
npm run build

# Verify installation
./bin/mec --version
```

### Configuration
```bash
# Configure your environment
mec configure \
  --token-url "https://admin-suite-stable.qa.den.medallia.com/oauth/merlin/token" \
  --client-id "digital_integration" \
  --client-secret "your-client-secret" \
  --api-gateway-url "https://admin-suite-stable-merlin.apis.medallia.com"

# Create named profiles
mec configure \
  --profile "merlin-qa" \
  --token-url "..." \
  --client-id "..." \
  --client-secret "..." \
  --api-gateway-url "..." \
  --languages "Spanish,French" \
  --output-path "~/Downloads/"
```

## Usage

### Profile Management
```bash
mec profiles list                             # List all profiles
mec profiles list --detailed                  # Show detailed profile info
mec profiles show --profile "merlin-sbx"      # Show specific profile
mec profiles delete --profile "merlin-prod"   # Delete a profile
```

### Survey Operations
```bash
mec surveys list                    # List all surveys
mec surveys list --name "feedback"  # Filter by name
mec surveys list --uuid "..."       # Find by UUID
```

### Translation Operations

#### Download
```bash
# Download translations by survey name
mec translations download --survey-name "feedback"

# Download translations by survey UUID
mec translations download --survey-uuid "dfc33eb1-2039-4bb5-b682-0a9dc894b2e5"

# With language filtering
mec translations download \
  --survey-name "feedback" \
  --languages "Spanish,French"

# Include HTML content
mec translations download \
  --survey-name "feedback" \
  --include-html-blocks
```

#### Upload
```bash
# Upload translations
mec translations upload --file "translations.xlsx"

# Dry run (preview changes)
mec translations upload --file "translations.xlsx" --pretend-upload
```

### Options

| Option | Description |
|--------|-------------|
| `--profile` | Profile to use |
| `--languages` | Comma-separated language list |
| `--output-path` | Custom output directory |
| `--include-html-blocks` | Include HTML content |
| `--save-debug-files` | Save debug files for troubleshooting |
| `--pretend-upload` | Dry run mode |

## Project Structure

```
src/
├── app/                    # Application entry point
├── commands/               # CLI command handlers
├── core/
│   ├── adapters/          # HTTP & File system adapters
│   ├── config/            # Configuration management
│   └── services/          # Business logic (surveys, translations)
├── ui/                    # User interface (prompts, formatting, parser)
└── utils/                 # Utilities (logging, helpers, errors)
```

## Help

```bash
mec --help                           # Main help
mec configure --help                 # Command-specific help
mec translations download --help     # Subcommand help
```

---

**Version:** 1.0.0 | **Last Updated:** September 2025
