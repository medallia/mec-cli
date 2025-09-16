import { ConfigurationError, ValidationError } from '../../utils/errors';

import {
  PROFILE_DEFAULTS,
  REQUIRED_PROFILE_FIELDS,
  PROFILE_KEYS,
  COMMANDS,
  APP_NAME,
  CLI_OPTIONS,
} from './constants';
import { ProfileConfig, Profile, ProfileSummary } from './types';

/**
 * Profile management utilities
 */
export class ProfileManager {
  /**
   * Convert ProfileConfig to Profile format
   */
  static configToProfile(profileName: string, config: ProfileConfig): Profile {
    if (!this.isProfileComplete(config)) {
      const missing = this.getMissingFields(config);
      throw new ConfigurationError(
        `Missing required configuration for profile "${profileName}": ${missing.join(', ')}\n` +
          `Please run "${APP_NAME} ${COMMANDS.CONFIGURE} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILE)} ${profileName}" to complete the setup.`
      );
    }

    return {
      name: profileName,
      baseUrl: config[PROFILE_KEYS.API_GATEWAY_URL]!,
      oauth2: {
        clientId: config[PROFILE_KEYS.OAUTH_CLIENT_ID]!,
        clientSecret: config[PROFILE_KEYS.OAUTH_CLIENT_SECRET]!,
        tokenUrl: config[PROFILE_KEYS.TOKEN_URL]!,
      },
      outputPath: config[PROFILE_KEYS.OUTPUT_PATH] || PROFILE_DEFAULTS.OUTPUT_PATH,
    };
  }

  /**
   * Validate profile completeness
   */
  static isProfileComplete(config: ProfileConfig): boolean {
    return REQUIRED_PROFILE_FIELDS.every(field => config[field] && config[field].trim().length > 0);
  }

  /**
   * Get missing required fields
   */
  static getMissingFields(config: ProfileConfig): string[] {
    return REQUIRED_PROFILE_FIELDS.filter(
      field => !config[field] || config[field].trim().length === 0
    );
  }

  /**
   * Get profile status information
   */
  static getProfileStatus(config: ProfileConfig): {
    isComplete: boolean;
    status: 'complete' | 'incomplete';
    missingFields: string[];
    completionPercentage: number;
  } {
    const missing = this.getMissingFields(config);
    const isComplete = missing.length === 0;
    const completionPercentage = Math.round(
      ((REQUIRED_PROFILE_FIELDS.length - missing.length) / REQUIRED_PROFILE_FIELDS.length) * 100
    );

    return {
      isComplete,
      status: isComplete ? 'complete' : 'incomplete',
      missingFields: missing,
      completionPercentage,
    };
  }

  /**
   * Get comprehensive profile summary
   */
  static getProfileSummary(name: string, config: ProfileConfig): ProfileSummary {
    const status = this.getProfileStatus(config);
    const configuredFields = REQUIRED_PROFILE_FIELDS.filter(
      field => config[field] && config[field].trim().length > 0
    );

    return {
      name,
      status: status.status,
      completionPercentage: status.completionPercentage,
      missingFields: status.missingFields,
      isComplete: status.isComplete,
      configuredFields,
      baseUrl: config[PROFILE_KEYS.API_GATEWAY_URL],
      outputPath: config[PROFILE_KEYS.OUTPUT_PATH] || PROFILE_DEFAULTS.OUTPUT_PATH,
      tokenUrl: config[PROFILE_KEYS.TOKEN_URL],
      clientId: config[PROFILE_KEYS.OAUTH_CLIENT_ID],
      clientSecret: config[PROFILE_KEYS.OAUTH_CLIENT_SECRET],
      languages: config[PROFILE_KEYS.LANGUAGES],
      includeHtmlBlocks: config[PROFILE_KEYS.INCLUDE_HTML_BLOCKS],
    };
  }

  /**
   * Get all profiles with their summaries
   */
  static getProfilesSummary(profiles: Record<string, ProfileConfig>): ProfileSummary[] {
    return Object.entries(profiles).map(([name, config]) => this.getProfileSummary(name, config));
  }

  /**
   * Merge default configuration with user configuration
   */
  static mergeConfigs(
    defaultConfig: ProfileConfig,
    userConfig: Partial<ProfileConfig>
  ): ProfileConfig {
    return {
      ...defaultConfig,
      ...userConfig,
    };
  }

  /**
   * Get human-readable field names
   */
  static getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      [PROFILE_KEYS.TOKEN_URL]: 'Token URL',
      [PROFILE_KEYS.API_GATEWAY_URL]: 'API Gateway URL',
      [PROFILE_KEYS.OAUTH_CLIENT_ID]: 'OAuth Client ID',
      [PROFILE_KEYS.OAUTH_CLIENT_SECRET]: 'OAuth Client Secret',
      [PROFILE_KEYS.LANGUAGES]: 'Languages',
      [PROFILE_KEYS.OUTPUT_PATH]: 'Output Path',
      [PROFILE_KEYS.INCLUDE_HTML_BLOCKS]: 'Include HTML Blocks',
    };

    return displayNames[fieldName] || fieldName;
  }

  /**
   * Get MEC instance admin base URL
   */
  static getMECInstanceUrl(profile: Profile): string {
    try {
      const tokenUrl = new URL(profile.oauth2.tokenUrl);

      // Extract tenant from OAuth URL path: /oauth/<tenant>/token
      const pathParts = tokenUrl.pathname.split('/');
      const oauthIndex = pathParts.indexOf('oauth');

      if (oauthIndex === -1 || oauthIndex + 1 >= pathParts.length) {
        throw new ValidationError(
          `Cannot extract tenant from OAuth URL path: ${tokenUrl.pathname}`
        );
      }

      const tenant = pathParts[oauthIndex + 1];

      if (!tenant || tenant === 'token') {
        throw new ValidationError(`Invalid tenant extracted from OAuth URL: ${tenant}`);
      }

      // Build admin base URL with tenant
      return `${tokenUrl.protocol}//${tokenUrl.host}/${tenant}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ValidationError(
        `Invalid token URL in profile "${profile.name}" (${profile.oauth2.tokenUrl}) : ${errorMessage}`
      );
    }
  }
}
