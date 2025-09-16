import { ProfileConfig } from '../core';
import { APP_NAME, COMMANDS, SUB_COMMANDS, CLI_OPTIONS } from '../core/config/constants';
import { ValidationError } from '../utils/errors';

import { ICommand, CommandContext } from './types';

export class ProfilesCommand implements ICommand {
  name = COMMANDS.PROFILES;
  description = 'Manage configuration profiles';

  async execute(context: CommandContext): Promise<void> {
    const { core, ui, options } = context;

    const configService = core.getConfigService();
    const action = options.action; // From yargs positional

    switch (action) {
      case SUB_COMMANDS.PROFILES.LIST: {
        if (options.detailed) {
          const allProfiles = await configService.getAllProfiles();
          ui.displayDetailedProfiles(allProfiles);
        } else {
          const profiles = await configService.listProfiles();
          ui.displayProfiles(profiles);
        }
        break;
      }

      case SUB_COMMANDS.PROFILES.SHOW: {
        const showName = options.name;
        if (!showName) {
          throw new ValidationError(
            `Profile name required. Usage: ${APP_NAME} ${COMMANDS.PROFILES} ${SUB_COMMANDS.PROFILES.SHOW} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILES.NAME)} <name>`
          );
        }
        const profile: ProfileConfig = await configService.getProfile(showName);
        ui.displayProfileDetails(showName, profile);
        break;
      }

      case SUB_COMMANDS.PROFILES.DELETE: {
        const deleteName = options.name;
        if (!deleteName) {
          throw new ValidationError(
            `Profile name required. Usage: ${APP_NAME} ${COMMANDS.PROFILES} ${SUB_COMMANDS.PROFILES.DELETE} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILES.NAME)} <name>`
          );
        }
        await configService.deleteProfile(deleteName);
        ui.displaySuccess(`Profile '${deleteName}' deleted successfully`);
        break;
      }

      default:
        throw new ValidationError(`Unknown ${COMMANDS.PROFILES} action: ${action}`);
    }
  }
}
