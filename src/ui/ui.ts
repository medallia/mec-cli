import { APP_NAME, COMMANDS, EMOJIS } from '../core/config/constants';
import { ProfileManager } from '../core/config/profiles';
import { ProfileConfig, ProfileSummary, VersionInfo } from '../core/config/types';
import { SurveyItem } from '../core/services/surveys/types';
import { TranslationImportChangesItem } from '../core/services/translations/types';

import { OutputFormatter, TableFormatter, ProgressFormatter, Colors } from './formatting';
import { ConfigurationPrompt } from './prompts/configuration';

/**
 * Simple UI interface that delegates to specialized formatters
 */
export class UI {
  private output: OutputFormatter;
  private table: TableFormatter;
  private progress: ProgressFormatter;
  private prompts: ConfigurationPrompt;

  constructor() {
    this.output = new OutputFormatter();
    this.table = new TableFormatter();
    this.progress = new ProgressFormatter();
    this.prompts = new ConfigurationPrompt();
  }

  // Prompt methods
  async promptForConfiguration(profileName: string): Promise<ProfileConfig> {
    return await this.prompts.collectProfileData(profileName);
  }

  // Display methods that use formatters
  // Profiles
  displayProfiles(profileNames: string[]): void {
    if (profileNames.length === 0) {
      console.log(
        this.output.formatWarning(
          `No profiles configured. Run '${APP_NAME} ${COMMANDS.CONFIGURE}' first.`
        )
      );
      return;
    }

    console.log(Colors.info(`\n${EMOJIS.PROFILE} Configured Profile(s):`));
    this.table.displayProfilesTable(profileNames);
  }

  displayDetailedProfiles(profiles: Record<string, ProfileConfig>): void {
    const profilesSummary: ProfileSummary[] = ProfileManager.getProfilesSummary(profiles);
    if (profilesSummary.length === 0) {
      console.log(
        this.output.formatWarning(
          `No profiles configured. Run '${APP_NAME} ${COMMANDS.CONFIGURE}' first.`
        )
      );
      return;
    }

    console.log(
      Colors.info(`\n${EMOJIS.PROFILE} Configured Profiles (${profilesSummary.length}):`)
    );
    this.table.displayDetailedProfilesTable(profilesSummary);
  }

  displayProfileDetails(profileName: string, config: ProfileConfig): void {
    const summary = ProfileManager.getProfileSummary(profileName, config);

    console.log(Colors.info(`\n${EMOJIS.PROFILE} Profile Details: ${profileName}`));
    this.table.displaySingleProfileDetails(summary);
  }

  // Surveys
  displaySurveys(
    surveys: SurveyItem[],
    getAdminSurveyEditorUrlById: (_id: string) => string
  ): void {
    // To avoid displaying an empty table when no surveys are found, show a warning instead
    if (surveys.length === 0) {
      console.log(this.output.formatWarning('No survey programs found'));
      return;
    }

    console.log(Colors.info(`\n${EMOJIS.SURVEY} Survey Program(s):`));
    this.table.displaySurveysTable(surveys, getAdminSurveyEditorUrlById);
  }

  // Translations
  displayTranslationChanges(changes: TranslationImportChangesItem[]): void {
    if (!changes || changes.length === 0) {
      console.log(this.output.formatWarning('No translation changes found'));
      return;
    }

    if (changes.length <= 100) {
      console.log(Colors.info(`\n${EMOJIS.SURVEY} Translation Change(s) Preview:`));
      this.table.displayTranslationChangesTable(changes);
    } else {
      // Profile changes hidden when changes exceed 100
      console.log(
        Colors.info(
          `\n${EMOJIS.SURVEY} Translation Changes exceed 100 items, skipping detailed table preview...`
        )
      );
    }

    console.log(Colors.info(`\n${EMOJIS.SURVEY} Translation Change Stats:`));
    this.table.displayTranslationChangesStatsTable(changes);
  }

  // Version updates
  displayVersionUpdate(versionInfo: VersionInfo): void {
    if (!versionInfo.updateAvailable) {
      return;
    }

    this.table.displayVersionUpdate(versionInfo);
  }

  // Simple output methods
  displayError(message: string): void {
    console.error(this.output.formatError(message));
  }

  displaySuccess(message: string): void {
    console.log(this.output.formatSuccess(message));
  }

  displayInfo(message: string): void {
    console.log(this.output.formatInfo(message));
  }

  displayWarning(message: string): void {
    console.warn(this.output.formatWarning(message));
  }

  // Access to individual formatters for advanced use cases
  get formatters() {
    return {
      output: this.output,
      table: this.table,
      progress: this.progress,
    };
  }
}
