import Table from 'cli-table3';

import { ProfileSummary } from '../../core';
import {
  APP_NAME,
  CLI_OPTIONS,
  COMMANDS,
  EMOJIS,
  PROFILE_DEFAULTS,
  SUB_COMMANDS,
} from '../../core/config/constants';
import { SurveyItem } from '../../core/services/surveys/types';
import { TranslationImportChangesItem } from '../../core/services/translations/types';
import { maskSecret } from '../../utils/helpers';
import { Colors } from './colors';

export class TableFormatter {
  displayKeyValueTable(data: Record<string, string>): void {
    const table = new Table({
      style: {
        head: [],
        border: ['gray'],
      },
    });

    Object.entries(data).forEach(([key, value]) => {
      const row: Record<string, string> = {};
      row[Colors.accent(key)] = Colors.tableContent(value);
      table.push(row);
    });

    console.log(table.toString());
  }

  /**
   * Profiles
   */
  displayProfilesTable(profileNames: string[]): void {
    const table = new Table({
      head: [
        Colors.tableHeader('No.'),
        Colors.tableHeader('Profile Name'),
        Colors.tableHeader('Status'),
      ],
      colWidths: [5, 30, 15],
      style: {
        head: [],
        border: ['gray'],
      },
      wordWrap: true,
    });

    profileNames.forEach((name, index) => {
      const status =
        name === PROFILE_DEFAULTS.NAME
          ? Colors.statusDefault(`Default`)
          : Colors.statusActive(`Active`);

      table.push([Colors.tableIndex((index + 1).toString()), Colors.tableValue(name), status]);
    });

    console.log(table.toString());
  }

  /**
   * Display detailed profiles table with status
   */
  displayDetailedProfilesTable(profilesSummary: ProfileSummary[]): void {
    profilesSummary.forEach((profile, index) => {
      const statusIcon = profile.isComplete ? EMOJIS.SUCCESS : EMOJIS.WARNING;
      const statusText = profile.isComplete ? 'Complete' : 'Incomplete';

      console.log(
        `  ${index + 1}. ${Colors.accent(profile.name)} - ${statusIcon} ${statusText} (${profile.completionPercentage}%)`
      );
      console.log(`     API Gateway: ${profile.baseUrl || Colors.muted('Not set')}`);

      if (!profile.isComplete && profile.missingFields.length > 0) {
        console.log(`     Missing: ${Colors.warning(profile.missingFields.join(', '))}`);
      }
      console.log('');
    });

    console.log(
      Colors.muted(
        `${EMOJIS.INFO} Use "${APP_NAME} ${COMMANDS.PROFILES} ${SUB_COMMANDS.PROFILES.SHOW} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILES.NAME)} <name>" for detailed information.`
      )
    );
  }

  /**
   * Display single profile details
   */
  displaySingleProfileDetails(profileSummary: ProfileSummary): void {
    const statusIcon = profileSummary.isComplete ? EMOJIS.SUCCESS : EMOJIS.WARNING;
    const statusText = profileSummary.isComplete ? 'Complete' : 'Incomplete';

    console.log(
      `${EMOJIS.PROGRESS} Status: ${statusIcon} ${statusText} (${profileSummary.completionPercentage}%)`
    );
    console.log('');

    console.log(`${EMOJIS.CONFIG} Profile Configuration:`);
    console.log(`   Name: ${Colors.accent(profileSummary.name)}`);
    console.log(
      `   API Gateway URL: ${profileSummary.baseUrl || Colors.error(`${EMOJIS.ERROR} Not set`)}`
    );
    console.log(
      `   Token URL: ${profileSummary.tokenUrl || Colors.error(`${EMOJIS.ERROR} Not set`)}`
    );
    console.log(
      `   Client ID: ${profileSummary.clientId || Colors.error(`${EMOJIS.ERROR} Not set`)}`
    );
    console.log(
      `   Client Secret: ${profileSummary.clientSecret ? maskSecret(profileSummary.clientSecret) : Colors.error(`${EMOJIS.ERROR} Not set`)}`
    );
    console.log(
      `   Output Path: ${profileSummary.outputPath || Colors.warning(`Default: ${PROFILE_DEFAULTS.OUTPUT_PATH}`)}`
    );
    console.log(`   Languages: ${profileSummary.languages || Colors.muted('Not set')}`);
    console.log(
      `   Include HTML Blocks: ${profileSummary.includeHtmlBlocks ? Colors.success('Yes') : Colors.muted('No')}`
    );
    console.log('');

    if (!profileSummary.isComplete) {
      console.log('');
      console.log(
        Colors.info(
          `${EMOJIS.INFO} Run "${APP_NAME} ${COMMANDS.CONFIGURE} --profile ${profileSummary.name}" to complete the setup.`
        )
      );
    }
  }

  /**
   * Surveys
   */
  displaySurveysTable(
    surveys: SurveyItem[],
    getAdminSurveyEditorUrlById: (id: string) => string
  ): void {
    const table = new Table({
      head: [
        Colors.tableHeader('No.'),
        Colors.tableHeader('Survey Name'),
        Colors.tableHeader('Survey ID'),
      ],
      colWidths: [5, 50, 40],
      style: {
        head: [],
        border: ['gray'],
        'padding-left': 1,
        'padding-right': 1,
      },
      wordWrap: true,
    });

    surveys.forEach((survey, index) => {
      const href = getAdminSurveyEditorUrlById(survey.id);

      const row = [
        { content: Colors.tableIndex((index + 1).toString()) },
        { content: Colors.tableValue(`${survey.name}`), href },
        { content: Colors.tableId(survey.id) },
      ];

      table.push(row);
    });

    console.log(table.toString());
  }

  /**
   * Translations
   */

  displayTranslationChangesTable(changes: TranslationImportChangesItem[]): void {
    const table = new Table({
      head: [
        Colors.tableHeader('ID'),
        Colors.tableHeader('Type'),
        Colors.tableHeader('Category'),
        Colors.tableHeader('Old Text'),
        Colors.tableHeader('New Text'),
      ],
      colWidths: [5, 14, 22, 38, 38],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    changes.forEach((change, index) => {
      table.push([
        Colors.tableIndex((index + 1).toString()),
        Colors.tableContent(change.type || ''),
        Colors.tableContent(change.translation_category || ''),
        Colors.muted(change.old_text || ''),
        Colors.success(change.new_text || ''),
      ]);
    });

    console.log(table.toString());
  }

  displayTranslationChangesStatsTable(changes: TranslationImportChangesItem[]): void {
    const typeCounts = changes.reduce(
      (acc, change) => {
        acc[change.type] = (acc[change.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const table = new Table({
      head: [Colors.tableHeader('Type'), Colors.tableHeader('Count')],
      colWidths: [16, 16],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      table.push([Colors.tableContent(type), Colors.tableIndex(count.toString())]);
    });

    console.log(table.toString());
  }
}
