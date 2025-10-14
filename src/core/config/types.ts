// User's configuration file
export interface ProfileConfig {
  // Token settings
  tokenUrl?: string;
  oAuthClientId?: string;
  oAuthClientSecret?: string;

  // Base URL / API Gateway URL
  apiGatewayUrl?: string;

  // Other settings
  languages?: string;
  outputPath?: string;
  includeHtmlBlocks?: boolean;
}

// Service ready profile
export interface Profile {
  name: string;
  baseUrl: string;
  oauth2: OAuth2Config;
  outputPath: string;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
}

export interface ProfileSummary {
  name: string;
  status: 'complete' | 'incomplete';
  completionPercentage: number;
  missingFields: string[];
  isComplete: boolean;
  configuredFields: string[];
  baseUrl?: string;
  outputPath?: string;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  languages?: string;
  includeHtmlBlocks?: boolean;
}

// Installation method type
export type InstallationMethod = 'npm' | 'homebrew' | 'standalone-binary' | 'unknown';

// Version check information
export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  installationMethod: InstallationMethod;
  changelogUrl: string;
  updateCommand: string;
}

// Version check cache data
export interface VersionCheckCache {
  lastCheckTime: number;
  lastAlertShownTime?: number;
  versionInfo: VersionInfo;
}

export interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
}
