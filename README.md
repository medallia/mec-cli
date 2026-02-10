# MEC CLI

This application is a reference implementation for interacting with Medallia Experience Cloud (MEC) services via the command line.

## Quick Start

### Installation

#### Standard User Installation

**Prerequisites:**
- [Homebrew](https://brew.sh/) (macOS/Linux package manager)

Install via Homebrew for the easiest setup:

```bash
# Add the Medallia tap
brew tap medallia/mec-cli

# Install mec
brew install mec

# Verify installation
mec --help
```

To upgrade to the latest version:
```bash
brew upgrade mec
```

#### Developer Installation

**Prerequisites:**
- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/) (version 11 or higher; comes with Node.js)
- [Git](https://git-scm.com/) (for cloning the repository)

For contributing to the project or local development:

```bash
# Clone the repository
git clone https://github.com/medallia/mec-cli.git
cd mec-cli

# Install dependencies and build
npm install
npm run build

# Verify installation
./bin/mec --help
```

> **Developer Tip:** For local development, add `./bin` to your `PATH` or create an alias for easier use:
>
> ```bash
> # For bash users
> echo "alias mec='$(pwd)/bin/mec'" >> ~/.bashrc && source ~/.bashrc
> 
> # For zsh users  
> echo "alias mec='$(pwd)/bin/mec'" >> ~/.zshrc && source ~/.zshrc
> ```
>
> After this, you can run `mec` from anywhere in your terminal.
>
> **Note:** If you later install via Homebrew, remove the alias or PATH modification as `brew install mec` automatically adds `mec` to your PATH.

### Configuration

Configure authentication and connection settings using profiles. Profiles store your credentials and preferences for connecting to MEC environments.

#### Prerequisites

Before configuring a profile, you need to obtain the following credentials from your MEC instance:

**Required Credentials:**

1. **OAuth Client ID & Secret**
   - Create an AppID account in MEC
   - Generate an OAuth Client using the **Client Credentials Grant** type
   - Note: This client will be used for API authentication

2. **OAuth Token URL**
   - Retrieved from the OAuth configuration in your MEC instance
   - Format: `https://{host}/oauth/{realm}/token`
   - Example: `https://admin-suite-stable.qa.den.medallia.com/oauth/merlin/token`

3. **API Gateway URL (Public API Hostname)**
   - Found under **"Public APIs Setup"** in your MEC instance
   - Format: `https://{host}.apis.medallia.com`
   - Example: `https://admin-suite-stable-merlin.apis.medallia.com`

> **Need Help?** Detailed instructions for setting up these credentials are available in the [Medallia documentation](https://docs.medallia.com). If you encounter any issues, please contact your Medallia administrator or support team.

#### Method 1: Interactive Configuration (Recommended)

The interactive mode guides you through setup with prompts:

```bash
# Configure default profile
mec configure

# Configure named profile
mec configure --profile "merlin-qa"
```

Use `--quick` flag to skip optional settings and use defaults:
```bash
mec configure --quick
```

#### Method 2: Command-Line Arguments

Pass all settings directly via command-line flags for non-interactive setup:

```bash
# Configure default profile
mec configure \
  --token-url "https://admin-suite-stable.qa.den.medallia.com/oauth/merlin/token" \
  --client-id "mec_cli_integration" \
  --client-secret "your-client-secret" \
  --api-gateway-url "https://admin-suite-stable-merlin.apis.medallia.com"

# Configure named profile with optional settings
mec configure \
  --profile "merlin-qa" \
  --token-url "https://admin-suite-stable.qa.den.medallia.com/oauth/merlin/token" \
  --client-id "mec_cli_integration" \
  --client-secret "your-client-secret" \
  --api-gateway-url "https://admin-suite-stable-merlin.apis.medallia.com" \
  --languages "Spanish,French" \
  --output-path "~/Downloads/" \
  --include-html-blocks
```

**Required Parameters:**
- `--token-url`: MEC OAuth token endpoint
- `--client-id`: MEC OAuth client ID
- `--client-secret`: MEC OAuth client secret
- `--api-gateway-url`: MEC API gateway base URL (Public API Hostname) 

**Optional Parameters:**
- `--profile`: Profile name (default: `default`)
- `--languages`: Comma-separated language list (default: `English`)
- `--output-path`: Download directory (default: `./`)
- `--include-html-blocks`: Include HTML content in translations (default: `false`)

#### Method 3: Direct File Editing

Advanced users can manually edit the configuration file:

**Location:** `${USER_HOME}/.mec/profiles`

**Format:** INI file with secure permissions (owner read/write only)

```ini
[default]
tokenUrl = https://admin-suite-stable.qa.den.medallia.com/oauth/merlin/token
oAuthClientId = digital_integration
oAuthClientSecret = your-client-secret
apiGatewayUrl = https://admin-suite-stable-merlin.apis.medallia.com
languages = English
outputPath = ./
includeHtmlBlocks = false

[merlin-qa]
tokenUrl = https://admin-suite-stable.qa.den.medallia.com/oauth/merlin/token
oAuthClientId = digital_integration
oAuthClientSecret = your-client-secret
apiGatewayUrl = https://admin-suite-stable-merlin.apis.medallia.com
languages = Spanish,French
outputPath = ~/Downloads/
includeHtmlBlocks = true
```

> **Security Note:** The configuration file is automatically created with secure file permissions (600 - owner read/write only) to protect sensitive credentials.

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
mec surveys list                                                    # List all surveys
mec surveys list --name "feedback"                                  # Filter by name
mec surveys list --uuid "dfc33eb1-2039-4bb5-b682-0a9dc894b2e5"      # Find by UUID
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

## License

Copyright 2025.  Medallia, Inc.
    
Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License.  You may obtain
a copy of the License at
    
    http://www.apache.org/licenses/LICENSE-2.0
    
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
