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
