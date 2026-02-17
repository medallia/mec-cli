import inquirer from 'inquirer';
import type { DistinctQuestion } from 'inquirer';

import { ConfigService } from '../../core';
import { PROFILE_DEFAULTS, EMOJIS, PROFILE_KEYS } from '../../core/config/constants';
import { ProfileConfig } from '../../core/config/types';
import { log } from '../../utils';
import { maskSecret } from '../../utils/helpers';

import {
  PromptResult,
  ConfigurationPromptResult,
  RequiredPromptAnswers,
  OptionalPromptAnswers,
} from './types';

export class ConfigurationPrompt {
  async collectProfileData(
    profileName: string = PROFILE_DEFAULTS.NAME,
    quickSetup: boolean = false,
    existingConfig?: ProfileConfig
  ): Promise<ProfileConfig> {
    const setupType = quickSetup ? 'Quick profile setup' : 'Configuring profile';
    const isExisting = !!existingConfig;
    const actionText = isExisting ? 'Updating existing profile' : setupType;

    log.info(`${EMOJIS.CONFIG} ${actionText}: ${profileName}`);

    // Use existing values or defaults
    const getDefault = <K extends keyof ProfileConfig>(key: K, fallback: ProfileConfig[K]) => {
      return existingConfig?.[key] ?? fallback;
    };

    // Required fields (always asked)
    const requiredPrompts: DistinctQuestion<RequiredPromptAnswers>[] = [
      {
        type: 'input',
        name: PROFILE_KEYS.TOKEN_URL,
        message: 'OAuth Token URL:',
        default: getDefault('tokenUrl', undefined),
        validate: (input: string) => {
          if (!input?.startsWith('http')) {
            return 'Please enter a valid URL starting with http:// or https://';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: PROFILE_KEYS.OAUTH_CLIENT_ID,
        message: 'OAuth Client ID:',
        default: getDefault('oAuthClientId', undefined),
        validate: (input: string) => {
          if (!input || input.length < 1) {
            return 'Client ID is required';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: PROFILE_KEYS.OAUTH_CLIENT_SECRET,
        message: existingConfig?.oAuthClientSecret
          ? `OAuth Client Secret (${maskSecret(existingConfig.oAuthClientSecret)}):`
          : 'OAuth Client Secret:',
        mask: '*',
        validate: (input: string) => {
          // If there's an existing secret and input is empty, that's OK (keep existing)
          if (existingConfig?.oAuthClientSecret && (!input || input.trim() === '')) {
            return true;
          }
          // For new profiles or when user provides input, validate it
          if (!input || input.length < 1) {
            return 'Client Secret is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: PROFILE_KEYS.API_GATEWAY_URL,
        message: 'API Gateway URL:',
        default: getDefault('apiGatewayUrl', undefined),
        validate: (input: string) => {
          if (!input?.startsWith('http')) {
            return 'Please enter a valid URL starting with http:// or https://';
          }
          return true;
        },
      },
    ];

    // Optional fields (only asked in full setup)
    const optionalPrompts: DistinctQuestion<OptionalPromptAnswers>[] = [
      {
        type: 'input',
        name: PROFILE_KEYS.LANGUAGES,
        message: 'Default languages for translations (comma-separated):',
        default: getDefault('languages', PROFILE_DEFAULTS.LANGUAGES),
      },
      {
        type: 'input',
        name: PROFILE_KEYS.OUTPUT_PATH,
        message: 'Output Path:',
        default: getDefault('outputPath', PROFILE_DEFAULTS.OUTPUT_PATH),
      },
      {
        type: 'confirm',
        name: PROFILE_KEYS.INCLUDE_HTML_BLOCKS,
        message: 'Include HTML blocks in translations?',
        default: getDefault('includeHtmlBlocks', PROFILE_DEFAULTS.INCLUDE_HTML_BLOCKS),
      },
    ];

    // Ask required questions
    const requiredAnswers = await inquirer.prompt<RequiredPromptAnswers>(requiredPrompts);

    // Handle client secret: if empty and we have existing config, keep the existing secret
    if (
      existingConfig?.oAuthClientSecret &&
      requiredAnswers[PROFILE_KEYS.OAUTH_CLIENT_SECRET]?.trim() === ''
    ) {
      requiredAnswers[PROFILE_KEYS.OAUTH_CLIENT_SECRET] = existingConfig.oAuthClientSecret;
    }

    // For quick setup, apply defaults for optional fields
    if (quickSetup) {
      const config: ProfileConfig = {
        ...requiredAnswers,
        [PROFILE_KEYS.LANGUAGES]: getDefault('languages', PROFILE_DEFAULTS.LANGUAGES),
        [PROFILE_KEYS.OUTPUT_PATH]: getDefault('outputPath', PROFILE_DEFAULTS.OUTPUT_PATH),
        [PROFILE_KEYS.INCLUDE_HTML_BLOCKS]: getDefault(
          'includeHtmlBlocks',
          PROFILE_DEFAULTS.INCLUDE_HTML_BLOCKS
        ),
      } as ProfileConfig;

      log.info(
        `${EMOJIS.INFO} Optional settings set to defaults - you can modify these later if needed.`
      );

      return config;
    }

    // For full setup, ask optional questions too
    const optionalAnswers = await inquirer.prompt<OptionalPromptAnswers>(optionalPrompts);
    return { ...requiredAnswers, ...optionalAnswers } as ProfileConfig;
  }

  /**
   * Configure a specific profile - returns PromptResult with ConfigurationPromptResult
   */
  async promptForProfileConfiguration(
    profileName: string,
    quickSetup: boolean = false,
    configService?: ConfigService
  ): Promise<PromptResult<ConfigurationPromptResult>> {
    try {
      // Load existing profile if available
      let existingConfig: ProfileConfig | undefined;
      if (configService) {
        try {
          existingConfig = await configService.findProfile(profileName);
          if (existingConfig) {
            log.info(`${EMOJIS.INFO} Loading existing configuration for profile: ${profileName}`);
          }
        } catch {
          // Profile doesn't exist, which is fine for new profiles
          log.info(`Profile ${profileName} not found, creating new profile`);
        }
      }

      const config = await this.collectProfileData(profileName, quickSetup, existingConfig);
      return {
        success: true,
        data: {
          profileName,
          config,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration failed',
      };
    }
  }

  /**
   * Prompt for profile selection from existing profiles
   */
  async promptForProfileSelection(profiles: string[]): Promise<PromptResult<string>> {
    if (profiles.length === 0) {
      return {
        success: false,
        error: 'No profiles available',
      };
    }

    try {
      const { selectedProfile } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProfile',
          message: 'Select a profile:',
          choices: profiles,
        },
      ]);

      return {
        success: true,
        data: selectedProfile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile selection failed',
      };
    }
  }

  /**
   * Confirm profile deletion
   */
  async confirmProfileDeletion(profileName: string): Promise<PromptResult<boolean>> {
    try {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `${EMOJIS.WARNING} Are you sure you want to delete profile '${profileName}'?`,
          default: false,
        },
      ]);

      return {
        success: true,
        data: confirmed,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Confirmation failed',
      };
    }
  }
}
