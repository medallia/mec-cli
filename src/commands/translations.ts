import {
  DownloadTranslationsOptions,
  ProfileManager,
  SurveyItem,
  UploadTranslationsOptions,
} from '../core';
import {
  CLI_OPTIONS,
  COMMANDS,
  SUB_COMMANDS,
  EMOJIS,
  PROFILE_DEFAULTS,
} from '../core/config/constants';
import { MEC_ADMIN_SURVEY_EDITOR_URL } from '../core/services/surveys/constants';
import { log } from '../utils';
import { ValidationError } from '../utils/errors';

import { ICommand, CommandContext } from './types';

export class TranslationsCommand implements ICommand {
  name = COMMANDS.TRANSLATIONS;
  description = 'Download and upload translations';

  async execute(context: CommandContext): Promise<void> {
    const { core, ui, options } = context;

    const profileName: string = options.profile ?? PROFILE_DEFAULTS.NAME;
    const profileConfig = await core.getConfigService().getProfile(profileName);
    const profile = ProfileManager.configToProfile(profileName, profileConfig);

    const surveyService = await core.getSurveyService(profile);
    const translationService = await core.getTranslationService(profile);
    const adminBaseUrl = ProfileManager.getMECInstanceUrl(profile);
    const getAdminSurveyEditorUrlById = (id: string) =>
      MEC_ADMIN_SURVEY_EDITOR_URL(adminBaseUrl, id);

    const subcommand = options.action;

    switch (subcommand) {
      case SUB_COMMANDS.TRANSLATIONS.DOWNLOAD: {
        const surveyUuids = options[CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID];
        const surveyNames = options[CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME];

        if (!surveyUuids && !surveyNames) {
          throw new ValidationError(
            `Either ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)} or ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME)} must be provided`
          );
        }

        // Collect all surveys to process
        const surveyItemList: SurveyItem[] = [];

        // Process survey UUIDs
        if (surveyUuids && surveyUuids.length > 0) {
          for (const uuid of surveyUuids) {
            const survey = await surveyService.getSurveyByUuid(uuid as string);
            if (!survey) {
              throw new ValidationError(`Survey not found for UUID: "${uuid}"`);
            }
            surveyItemList.push(survey);
          }
        }

        // Process survey names
        if (surveyNames && surveyNames.length > 0) {
          for (const surveyName of surveyNames) {
            const surveys = await surveyService.getSurveyByName(surveyName as string);
            if (surveys.length > 1) {
              ui.displaySurveys(surveys, getAdminSurveyEditorUrlById);
              throw new ValidationError(
                `More than one survey program found with name: "${surveyName}", please specify a more unique name or use ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)}`
              );
            }
            if (surveys.length === 0) {
              throw new ValidationError(`Survey not found for name: "${surveyName}"`);
            }
            surveyItemList.push(surveys[0]);
          }
        }

        log.info(`${EMOJIS.DOWNLOAD}  Starting translation download...`);
        ui.formatters.progress.startSpinner('Downloading translations file...');
        const downloadOptions: DownloadTranslationsOptions = {
          surveys: surveyItemList,
          // Override priority: CLI options (only when provided) > Profile config > Defaults
          languages:
            options[CLI_OPTIONS.TRANSLATIONS.LANGUAGES] ??
            profileConfig?.languages ??
            PROFILE_DEFAULTS.LANGUAGES,
          outputPath:
            options[CLI_OPTIONS.TRANSLATIONS.OUTPUT_PATH] ||
            profileConfig?.outputPath ||
            PROFILE_DEFAULTS.OUTPUT_PATH,
          includeHtmlBlocks:
            options[CLI_OPTIONS.TRANSLATIONS.INCLUDE_HTML_BLOCKS] ??
            profileConfig?.includeHtmlBlocks ??
            PROFILE_DEFAULTS.INCLUDE_HTML_BLOCKS,
          // Debug options - not saved/collected as part of profile creation
          saveDebugFiles:
            options[CLI_OPTIONS.DEBUG] ??
            options[CLI_OPTIONS.TRANSLATIONS.SAVE_DEBUG_FILES] ??
            PROFILE_DEFAULTS.SAVE_DEBUG_FILES,
        };
        const result = await translationService.downloadTranslations(downloadOptions);
        ui.formatters.progress.stopSpinner();

        if (result.missingLanguages.length > 0) {
          ui.displayWarning(
            `Language(s) not available for translation: ${result.missingLanguages.join(', ')}`
          );
        }
        let successMessage = `Translation file downloaded to: ${result.processedFilePath}`;
        if (result.rawTranslationsFilePath) {
          successMessage += ` and the raw translations file saved to: ${result.rawTranslationsFilePath}`;
        }
        log.info(`${EMOJIS.SUCCESS} ${successMessage}`);
        ui.displaySuccess(successMessage);
        break;
      }
      case SUB_COMMANDS.TRANSLATIONS.UPLOAD: {
        const uploadOptions: UploadTranslationsOptions = {
          file: options[CLI_OPTIONS.TRANSLATIONS.FILE] ?? '',
          // Override priority: CLI options > Profile config > Defaults
          outputPath:
            options[CLI_OPTIONS.TRANSLATIONS.OUTPUT_PATH] ||
            profileConfig?.outputPath ||
            PROFILE_DEFAULTS.OUTPUT_PATH,
          // Debug options - not saved/collected as part of profile creation
          pretendUpload:
            options[CLI_OPTIONS.TRANSLATIONS.PRETEND_UPLOAD] ?? PROFILE_DEFAULTS.PRETEND_UPLOAD,
          saveDebugFiles:
            options[CLI_OPTIONS.DEBUG] ??
            options[CLI_OPTIONS.TRANSLATIONS.SAVE_DEBUG_FILES] ??
            PROFILE_DEFAULTS.SAVE_DEBUG_FILES,
        };

        if (!uploadOptions.file) {
          throw new ValidationError(
            `File path is required for upload. Use ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.FILE)} option.`
          );
        }

        log.info(`${EMOJIS.UPLOAD}  Starting translation upload...`);
        ui.formatters.progress.startSpinner('Uploading translations file...');
        const uploadResult = await translationService.uploadTranslations(uploadOptions);
        ui.formatters.progress.stopSpinner();
        if ('items' in uploadResult) {
          ui.displayTranslationChanges(uploadResult.items);
          log.info(`${EMOJIS.SUCCESS} Dry run completed - no changes were committed.`);
        } else {
          const uploadSuccessMessage = `Translation file uploaded successfully: ${uploadResult.translationsFilePath}`;
          log.info(`${EMOJIS.SUCCESS} ${uploadSuccessMessage}`);
          ui.displaySuccess(uploadSuccessMessage);
        }
        break;
      }
      default:
        throw new ValidationError(`Unknown ${COMMANDS.TRANSLATIONS} subcommand: ${subcommand}`);
    }
  }
}
