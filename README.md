# MEC CLI

This application is a reference implementation for interacting with Medallia Experience Cloud (MEC) services via the command line.

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/) (version 11 or higher; comes with Node.js)
- [Git](https://git-scm.com/) (for cloning the repository)

### Installation

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
> **Tip:** For local development, add `./bin` to your `PATH` or create an alias for easier use:
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
> **Note:** Remove the alias or PATH modification before installing via package managers (like `brew install`), as they automatically add `mec` to your PATH and may conflict with local development setup.

### Configuration

Configuration profiles are stored in `${USER_HOME}/.mec/profiles` as a human-readable INI file with secure file permissions (owner read/write only). Profiles can be managed via commands or edited directly in the file.

```bash
# Configure your default profile
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
