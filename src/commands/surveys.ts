import { COMMANDS, EMOJIS, PROFILE_DEFAULTS, ProfileManager, SUB_COMMANDS } from '../core/config';
import { MEC_ADMIN_SURVEY_EDITOR_URL } from '../core/services/surveys/constants';
import { log } from '../utils';
import { ValidationError } from '../utils/errors';

import { ICommand, CommandContext } from './types';

export class SurveysCommand implements ICommand {
  name = COMMANDS.SURVEYS;
  description = 'List and search survey programs';

  async execute(context: CommandContext): Promise<void> {
    const { core, ui, options } = context;

    const profileName: string = options.profile ?? PROFILE_DEFAULTS.NAME;
    const profileConfig = await core.getConfigService().getProfile(profileName);
    const profile = ProfileManager.configToProfile(profileName, profileConfig);

    const surveyService = await core.getSurveyService(profile);
    const adminBaseUrl = ProfileManager.getMECInstanceUrl(profile);
    const getAdminSurveyEditorUrlById = (id: string) =>
      MEC_ADMIN_SURVEY_EDITOR_URL(adminBaseUrl, id);

    const action = options.action; // From yargs positional

    switch (action) {
      case SUB_COMMANDS.SURVEYS.LIST: {
        let surveys;

        if (options.name) {
          log.info(`${EMOJIS.SEARCH} Fetching surveys filtered by name: "${options.name}"`);
          surveys = await surveyService.getSurveyByName(options.name);
        } else if (options.uuid) {
          log.info(`${EMOJIS.SEARCH} Fetching surveys filtered by UUID: "${options.uuid}"`);
          surveys = [await surveyService.getSurveyByUuid(options.uuid)];
        } else {
          log.info(`${EMOJIS.LOADING} Fetching surveys...`);
          surveys = await surveyService.getAllSurveys();
        }
        ui.displaySurveys(surveys, getAdminSurveyEditorUrlById);
        break;
      }

      default:
        throw new ValidationError(`Unknown surveys action: ${action}`);
    }
  }
}
