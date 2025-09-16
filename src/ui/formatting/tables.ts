import chalk from 'chalk';
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
      row[chalk.cyan(key)] = chalk.white(value);
      table.push(row);
    });

    console.log(table.toString());
  }

  /**
   * Profiles
   */
  displayProfilesTable(profileNames: string[]): void {
    const table = new Table({
      head: ['No.', 'Profile Name', 'Status'],
      colWidths: [5, 30, 15],
      style: {
        head: [],
        border: ['gray'],
      },
      wordWrap: true,
    });

    profileNames.forEach((name, index) => {
      const status = name === PROFILE_DEFAULTS.NAME ? chalk.green(`Default`) : chalk.blue(`Active`);

      table.push([chalk.cyan((index + 1).toString()), chalk.white(name), status]);
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
        `  ${index + 1}. ${chalk.cyan(profile.name)} - ${statusIcon} ${statusText} (${profile.completionPercentage}%)`
      );
      console.log(`     API Gateway: ${profile.baseUrl || chalk.gray('Not set')}`);

      if (!profile.isComplete && profile.missingFields.length > 0) {
        console.log(`     Missing: ${chalk.yellow(profile.missingFields.join(', '))}`);
      }
      console.log('');
    });

    console.log(
      chalk.gray(
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
    console.log(`   Name: ${chalk.cyan(profileSummary.name)}`);
    console.log(
      `   API Gateway URL: ${profileSummary.baseUrl || chalk.red(`${EMOJIS.ERROR} Not set`)}`
    );
    console.log(`   Token URL: ${profileSummary.tokenUrl || chalk.red(`${EMOJIS.ERROR} Not set`)}`);
    console.log(`   Client ID: ${profileSummary.clientId || chalk.red(`${EMOJIS.ERROR} Not set`)}`);
    console.log(
      `   Client Secret: ${profileSummary.clientSecret ? maskSecret(profileSummary.clientSecret) : chalk.red(`${EMOJIS.ERROR} Not set`)}`
    );
    console.log(
      `   Output Path: ${profileSummary.outputPath || chalk.yellow(`Default: ${PROFILE_DEFAULTS.OUTPUT_PATH}`)}`
    );
    console.log(`   Languages: ${profileSummary.languages || chalk.gray('Not set')}`);
    console.log(
      `   Include HTML Blocks: ${profileSummary.includeHtmlBlocks ? chalk.green('Yes') : chalk.gray('No')}`
    );
    console.log('');

    if (!profileSummary.isComplete) {
      console.log('');
      console.log(
        chalk.cyan(
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
      head: [chalk.white('No.'), chalk.white('Survey Name'), chalk.white('Survey ID')],
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
        { content: chalk.cyan((index + 1).toString()) },
        { content: chalk.blue(`${survey.name}`), href },
        { content: chalk.gray(survey.id) },
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
        chalk.white('ID'),
        chalk.white('Type'),
        chalk.white('Category'),
        chalk.white('Old Text'),
        chalk.white('New Text'),
      ],
      colWidths: [5, 14, 22, 38, 38],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    changes.forEach((change, index) => {
      table.push([
        chalk.cyan((index + 1).toString()),
        chalk.white(change.type || ''),
        chalk.white(change.translation_category || ''),
        chalk.gray(change.old_text || ''),
        chalk.green(change.new_text || ''),
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
      head: [chalk.white('Type'), chalk.white('Count')],
      colWidths: [16, 16],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      table.push([chalk.white(type), chalk.cyan(count.toString())]);
    });

    console.log(table.toString());
  }
}
