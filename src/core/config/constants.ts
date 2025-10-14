// App Information
export const APP_NAME = 'mec';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'A CLI tool for MEC (Medallia Experience Cloud) operations';
export const APP_REPOSITORY = 'https://github.com/medallia/mec-cli';

// File and Directory Configuration
export const CONFIG_DIR_NAME = '.mec';
export const PROFILES_FILE_NAME = 'profiles';
export const VERSION_CACHE_FILE_NAME = 'version-check';

// App Version Check for update notifications
export const VERSION_CHECK = {
  // Check interval for latest updates from the API in secs (default: 1 hour)
  CHECK_INTERVAL_SECS: parseInt('3600', 10), // 1 hour
  // Silence alert duration in secs (default: 24 hours)
  SILENCE_ALERT_DURATION_SECS: parseInt('86400', 10), // 24 hours
  // GitHub API endpoint for latest release
  GITHUB_API_LATEST_RELEASE_URL: 'https://api.github.com/repos/medallia/mec-cli/releases/latest',
} as const;

// Command Names
export const COMMANDS = {
  CONFIGURE: 'configure',
  PROFILES: 'profiles',
  SURVEYS: 'surveys',
  TRANSLATIONS: 'translations',
} as const;

// Sub Command Names
export const SUB_COMMANDS = {
  PROFILES: {
    LIST: 'list',
    SHOW: 'show',
    DELETE: 'delete',
  },
  SURVEYS: {
    LIST: 'list',
  },
  TRANSLATIONS: {
    DOWNLOAD: 'download',
    UPLOAD: 'upload',
  },
} as const;

// Shared CLI Options (used across multiple commands)
const SHARED_CLI_OPTIONS = {
  INCLUDE_HTML_BLOCKS: 'include-html-blocks',
  LANGUAGES: 'languages',
  OUTPUT_PATH: 'output-path',
} as const;

// CLI Options
export const CLI_OPTIONS = {
  PREFIX: '--',
  SHORTHAND_PREFIX: '-',
  WITH_PREFIX: (name: string) => `${CLI_OPTIONS.PREFIX}${name}`,
  WITH_SHORTHAND_PREFIX: (name: string) => `${CLI_OPTIONS.SHORTHAND_PREFIX}${name}`,
  HELP: 'help',
  HELP_SHORT: 'h',
  VERBOSE: 'verbose',
  VERBOSE_SHORT: 'v',
  DEBUG: 'debug',
  DEBUG_SHORT: 'd',
  CONFIGURE: {
    QUICK: 'quick',
  },
  PROFILE: 'profile',
  PROFILES: {
    NAME: 'name',
    TOKEN_URL: 'token-url',
    OAUTH_CLIENT_ID: 'client-id',
    OAUTH_CLIENT_SECRET: 'client-secret',
    API_GATEWAY_URL: 'api-gateway-url',
    OUTPUT_PATH: SHARED_CLI_OPTIONS.OUTPUT_PATH,
    LANGUAGES: SHARED_CLI_OPTIONS.LANGUAGES,
    INCLUDE_HTML_BLOCKS: SHARED_CLI_OPTIONS.INCLUDE_HTML_BLOCKS,
  },
  SURVEYS: {
    NAME: 'name',
    UUID: 'uuid',
  },
  TRANSLATIONS: {
    PRETEND_UPLOAD: 'pretend-upload',
    DRY_RUN: 'dry-run',
    SAVE_DEBUG_FILES: 'save-debug-files',
    FILE: 'file',
    INCLUDE_HTML_BLOCKS: SHARED_CLI_OPTIONS.INCLUDE_HTML_BLOCKS,
    LANGUAGES: SHARED_CLI_OPTIONS.LANGUAGES,
    OUTPUT_PATH: SHARED_CLI_OPTIONS.OUTPUT_PATH,
    SURVEY_NAME: 'survey-name',
    SURVEY_UUID: 'survey-uuid',
  },
} as const;

// Required Profile CLI Options
export const REQUIRED_PROFILE_CLI_OPTIONS = [
  CLI_OPTIONS.PROFILES.TOKEN_URL,
  CLI_OPTIONS.PROFILES.OAUTH_CLIENT_ID,
  CLI_OPTIONS.PROFILES.OAUTH_CLIENT_SECRET,
  CLI_OPTIONS.PROFILES.API_GATEWAY_URL,
];

// Profile Default Values
export const PROFILE_DEFAULTS = {
  NAME: 'default',
  LANGUAGES: 'English',
  OUTPUT_PATH: './',
  INCLUDE_HTML_BLOCKS: false,
  SAVE_DEBUG_FILES: false,
  PRETEND_UPLOAD: false,
  PROFILE_TEMPLATE: {
    languages: 'English',
    outputPath: '.',
    includeHtmlBlocks: false,
  },
};

// Profile Configuration Keys
export const PROFILE_KEYS = {
  LANGUAGES: 'languages',
  OUTPUT_PATH: 'outputPath',
  TOKEN_URL: 'tokenUrl',
  OAUTH_CLIENT_ID: 'oAuthClientId',
  OAUTH_CLIENT_SECRET: 'oAuthClientSecret',
  API_GATEWAY_URL: 'apiGatewayUrl',
  INCLUDE_HTML_BLOCKS: 'includeHtmlBlocks',
} as const;

// Required Profile Fields
export const REQUIRED_PROFILE_FIELDS = [
  PROFILE_KEYS.TOKEN_URL,
  PROFILE_KEYS.OAUTH_CLIENT_ID,
  PROFILE_KEYS.OAUTH_CLIENT_SECRET,
  PROFILE_KEYS.API_GATEWAY_URL,
] as const;

// Validation Rules
export const VALIDATION = {
  URL: {
    PATTERN: /^https?:\/\/.+/,
  },
  UUID: {
    PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
  PROFILE_NAME: {
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
};

// API Configuration
// Note: Environment variables can be set to override defaults
export const API_DEFAULTS = {
  TIMEOUT_MS: parseInt(process.env.MEC_API_TIMEOUT_MS || '30000', 10), // 30 seconds
  POLL_MAX_ATTEMPTS: parseInt(process.env.MEC_POLL_MAX_ATTEMPTS || '30', 10), // 30 attempts
  POLL_INTERVAL_MS: parseInt(process.env.MEC_POLL_INTERVAL_MS || '1000', 10), // 1 second
  RETRY_MAX_ATTEMPTS: parseInt(process.env.MEC_RETRY_MAX_ATTEMPTS || '3', 10), // 3 attempts
  RETRY_DELAY_MS: parseInt(process.env.MEC_RETRY_DELAY_MS || '1000', 10), // 1 second
  PAGINATION: {
    LIMIT: parseInt(process.env.MEC_PAGINATION_LIMIT || '50', 10), // 50 items
    OFFSET: parseInt(process.env.MEC_PAGINATION_OFFSET || '0', 10), // 0 offset
    MAX_LIMIT: parseInt(process.env.MEC_PAGINATION_MAX_LIMIT || '100', 10), // 100 items
  },
};

// Error Codes
// More comprehensive industry-standard CLI error codes
export const ERROR_CODES = {
  GENERAL_ERROR: 1, // General error (POSIX)
  MISUSE: 2, // Misuse of shell command (POSIX)
  CONFIG_ERROR: 3, // Configuration error
  AUTH_ERROR: 4, // Authentication failure
  NETWORK_ERROR: 5, // Network/connectivity error
  FILE_ERROR: 6, // File I/O error
  VALIDATION_ERROR: 7, // Input validation error
  PERMISSION_ERROR: 8, // Permission denied
  NOT_FOUND_ERROR: 9, // Resource not found
  TIMEOUT_ERROR: 10, // Operation timeout
} as const;

export const FILE_EXTENSIONS = {
  EXCEL: '.xlsx',
  JSON: '.json',
  INI: '.ini',
};

// File Size Limits
export const FILE_SIZE_LIMITS = {
  MAX_CONFIG_FILE_SIZE: 1024 * 1024, // 1MB
  MAX_UPLOAD_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_EXCEL_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Progress and UI
export const UI_SETTINGS = {
  MAX_CONSOLE_WIDTH: 120,
  MIN_CONSOLE_WIDTH: 50,
  SPINNER_INTERVAL: 100,
  SPINNER_CHARS: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  PROGRESS_BAR_LENGTH: 30,
} as const;

// Emojis for CLI Output
export const EMOJIS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '🔄',
  DOWNLOAD: '⬇️',
  UPLOAD: '⬆️',
  FILE: '📄',
  CONFIG: '⚙️',
  PROFILE: '👤',
  SURVEY: '📋',
  SEARCH: '🔍',
  LIST: '📝',
  PROGRESS: '📊',
  PENDING: '⏳',
  APP: '🚀',
  URL_LINK: '🔗',
};
