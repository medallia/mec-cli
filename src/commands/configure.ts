import { Arguments } from 'yargs';

import { ConfigService } from '../core/config/config-service';
import {
  EMOJIS,
  PROFILE_DEFAULTS,
  COMMANDS,
  CLI_OPTIONS,
  PROFILE_KEYS,
} from '../core/config/constants';
import { ProfileConfig } from '../core/config/types';
import { UI } from '../ui';
import { ConfigurationPrompt } from '../ui/prompts/configuration';
import { log } from '../utils';
import { handleError, ConfigurationError } from '../utils/errors';

import { ICommand, CommandContext, CliArgs } from './types';

export class ConfigureCommand implements ICommand {
  name = COMMANDS.CONFIGURE;
  description = 'Configure authentication and default settings';

  async execute(context: CommandContext): Promise<void> {
    const { core, ui, options } = context;

    const configService = core.getConfigService();
    const profileName = options.profile ?? (options._[1] as string) ?? PROFILE_DEFAULTS.NAME;
    const isInteractive = options.interactive !== false;

    try {
      if (isInteractive) {
        await this.handleInteractiveMode(configService, ui, options, profileName);
      } else {
        await this.handleNonInteractiveMode(configService, ui, options, profileName);
      }
    } catch (error) {
      const cliError = handleError(error);
      ui.displayError(cliError.message);
      process.exit(cliError.exitCode);
    }
  }

  /**
   * Handle interactive configuration mode
   */
  private async handleInteractiveMode(
    configService: ConfigService,
    ui: UI,
    options: Arguments<CliArgs>,
    profileName: string
  ): Promise<void> {
    log.info(`${EMOJIS.CONFIG} Starting interactive configuration for profile: ${profileName}`);

    const prompt = new ConfigurationPrompt();
    const result = await prompt.promptForProfileConfiguration(
      profileName,
      options.quick,
      configService
    );

    if (!result.success) {
      if (result.cancelled) {
        ui.displayInfo('Configuration cancelled');
        return;
      }
      throw new ConfigurationError(result.error || 'Configuration failed');
    }

    // Save the profile
    if (result.data) {
      await configService.saveProfile(result.data.profileName, result.data.config);
      ui.displaySuccess(`Profile (${result.data.profileName}) saved successfully`);
    }
  }

  /**
   * Handle non-interactive configuration mode
   */
  private async handleNonInteractiveMode(
    configService: ConfigService,
    ui: UI,
    options: Arguments<CliArgs>,
    profileName: string
  ): Promise<void> {
    log.info(`${EMOJIS.CONFIG} Starting non-interactive configuration for profile: ${profileName}`);

    // Create profile config directly from options
    const config: ProfileConfig = {
      [PROFILE_KEYS.TOKEN_URL]: options[CLI_OPTIONS.PROFILES.TOKEN_URL],
      [PROFILE_KEYS.OAUTH_CLIENT_ID]: options[CLI_OPTIONS.PROFILES.OAUTH_CLIENT_ID],
      [PROFILE_KEYS.OAUTH_CLIENT_SECRET]: options[CLI_OPTIONS.PROFILES.OAUTH_CLIENT_SECRET],
      [PROFILE_KEYS.API_GATEWAY_URL]: options[CLI_OPTIONS.PROFILES.API_GATEWAY_URL],
      [PROFILE_KEYS.LANGUAGES]:
        options[CLI_OPTIONS.PROFILES.LANGUAGES] || PROFILE_DEFAULTS.LANGUAGES,
      [PROFILE_KEYS.OUTPUT_PATH]:
        options[CLI_OPTIONS.PROFILES.OUTPUT_PATH] || PROFILE_DEFAULTS.OUTPUT_PATH,
      [PROFILE_KEYS.INCLUDE_HTML_BLOCKS]:
        options[CLI_OPTIONS.PROFILES.INCLUDE_HTML_BLOCKS] ?? PROFILE_DEFAULTS.INCLUDE_HTML_BLOCKS,
    };

    // Save the profile
    await configService.saveProfile(profileName, config);
    ui.displaySuccess(`Profile (${profileName}) saved successfully`);
  }
}
