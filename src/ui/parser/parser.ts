import yargs, { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { CliArgs } from '../../commands/types';
import {
  APP_NAME,
  APP_VERSION,
  APP_REPOSITORY,
  COMMANDS,
  PROFILE_DEFAULTS,
  UI_SETTINGS,
  CLI_OPTIONS,
  SUB_COMMANDS,
  REQUIRED_PROFILE_CLI_OPTIONS,
} from '../../core/config/constants';
import { ValidationError } from '../../utils/errors';

import { ParsedCommand } from './types';

export function createYargsParser() {
  return (
    yargs(hideBin(process.argv))
      .scriptName(APP_NAME)
      .version(APP_VERSION)
      .strict()
      .demandCommand(1, 'You must provide a command')
      .recommendCommands()
      .wrap(
        Math.min(
          UI_SETTINGS.MAX_CONSOLE_WIDTH,
          process.stdout.columns || UI_SETTINGS.MIN_CONSOLE_WIDTH
        )
      )
      .epilogue(`For more information, visit: ${APP_REPOSITORY}`)

      // Configure command with non-interactive options
      .command(
        `${COMMANDS.CONFIGURE} [${CLI_OPTIONS.PROFILE}]`,
        'Configure profile for MEC authentication and connectivity',
        yargs => {
          return (
            yargs
              .positional(CLI_OPTIONS.PROFILE, {
                describe: 'Profile name to configure, uses "default" if not provided',
                type: 'string',
                default: PROFILE_DEFAULTS.NAME,
              })
              // Non-interactive configuration options
              .option(CLI_OPTIONS.PROFILES.TOKEN_URL, {
                type: 'string',
                description: 'MEC OAuth Token URL (required for non-interactive mode)',
                requiresArg: true,
              })
              .option(CLI_OPTIONS.PROFILES.OAUTH_CLIENT_ID, {
                type: 'string',
                description: 'MEC OAuth Client ID (required for non-interactive mode)',
                requiresArg: true,
              })
              .option(CLI_OPTIONS.PROFILES.OAUTH_CLIENT_SECRET, {
                type: 'string',
                description: 'MEC OAuth Client Secret (required for non-interactive mode)',
                requiresArg: true,
              })
              .option(CLI_OPTIONS.PROFILES.API_GATEWAY_URL, {
                type: 'string',
                description: 'MEC API Gateway URL (required for non-interactive mode)',
                requiresArg: true,
              })
              .option(CLI_OPTIONS.PROFILES.LANGUAGES, {
                type: 'string',
                description: 'List of languages for translations (comma-separated)',
                default: PROFILE_DEFAULTS.LANGUAGES,
              })
              .option(CLI_OPTIONS.PROFILES.OUTPUT_PATH, {
                type: 'string',
                description: 'Path for downloading files',
                default: PROFILE_DEFAULTS.OUTPUT_PATH,
              })
              .option(CLI_OPTIONS.PROFILES.INCLUDE_HTML_BLOCKS, {
                type: 'boolean',
                description: 'Include HTML blocks in translations',
                default: PROFILE_DEFAULTS.INCLUDE_HTML_BLOCKS,
              })
              .option(CLI_OPTIONS.CONFIGURE.QUICK, {
                type: 'boolean',
                description:
                  'Enable quick mode (optional fields are skipped and set to defaults in interactive mode)',
                default: false,
              })
              .check(argv => {
                // If any required CLI options provided, must provide ALL
                const providedOptions = REQUIRED_PROFILE_CLI_OPTIONS.filter(
                  opt => argv[opt] !== undefined
                );

                if (providedOptions.length > 0) {
                  const missing = REQUIRED_PROFILE_CLI_OPTIONS.filter(opt => !argv[opt]);
                  if (missing.length > 0) {
                    throw new ValidationError(
                      `Non-interactive mode requires ALL required options: ${missing.map(opt => CLI_OPTIONS.WITH_PREFIX(opt)).join(', ')}`
                    );
                  }
                  argv['interactive'] = false;
                }
                return true;
              })
              .example(`$0 ${COMMANDS.CONFIGURE}`, 'Interactive setup')
              .example(`$0 ${COMMANDS.CONFIGURE} --quick`, 'Quick setup (required fields only)')
              .example(`$0 ${COMMANDS.CONFIGURE} caspian-prod`, 'Configure specific profile')
              .example(
                `$0 ${COMMANDS.CONFIGURE} caspian-prod 
                  ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILES.TOKEN_URL)} https://caspian.medallia.com/oauth/caspian/token 
                  ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILES.OAUTH_CLIENT_ID)} medallia_caspian 
                  ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILES.OAUTH_CLIENT_SECRET)} some-client-secret
                  ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILES.API_GATEWAY_URL)} https://caspian-caspian.apis.medallia.com/`,
                'Non-interactive configuration for a specific profile'
              )
          );
        }
      )

      // Profiles command
      .command(`${COMMANDS.PROFILES} <action>`, 'Manage configured profiles', yargs => {
        return yargs
          .positional('action', {
            describe: 'Action to perform',
            choices: [
              SUB_COMMANDS.PROFILES.LIST,
              SUB_COMMANDS.PROFILES.SHOW,
              SUB_COMMANDS.PROFILES.DELETE,
            ],
            demandOption: true,
          })
          .option(CLI_OPTIONS.PROFILES.NAME, {
            type: 'string',
            description: 'Profile name (for show/delete actions)',
          })
          .option('detailed', {
            alias: 'd',
            type: 'boolean',
            description: 'Show detailed information (for list action)',
            default: false,
          })
          .example(`$0 ${COMMANDS.PROFILES} ${SUB_COMMANDS.PROFILES.LIST}`, 'List all profiles')
          .example(
            `$0 ${COMMANDS.PROFILES} ${SUB_COMMANDS.PROFILES.LIST} --detailed`,
            'List profiles with details'
          )
          .example(
            `$0 ${COMMANDS.PROFILES} ${SUB_COMMANDS.PROFILES.SHOW} --name default`,
            'Show default profile details'
          )
          .example(
            `$0 ${COMMANDS.PROFILES} ${SUB_COMMANDS.PROFILES.DELETE} --name old-profile`,
            'Delete a profile'
          );
      })

      // Surveys command
      .command(`${COMMANDS.SURVEYS} <action>`, 'Survey operations', yargs => {
        return yargs
          .positional('action', {
            describe: 'Action to perform',
            choices: [SUB_COMMANDS.SURVEYS.LIST],
            demandOption: true,
          })
          .option(CLI_OPTIONS.PROFILE, {
            type: 'string',
            description: 'Profile to use',
            default: PROFILE_DEFAULTS.NAME,
          })
          .option(CLI_OPTIONS.SURVEYS.NAME, {
            type: 'string',
            description: 'Filter survey programs by name',
          })
          .option(CLI_OPTIONS.SURVEYS.UUID, {
            type: 'string',
            description: 'Filter survey programs by UUID',
          })
          .check(argv => {
            if (argv[CLI_OPTIONS.SURVEYS.NAME] !== undefined && !String(argv[CLI_OPTIONS.SURVEYS.NAME]).trim()) {
              throw new ValidationError(`${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.SURVEYS.NAME)} value must not be empty`);
            }
            if (argv[CLI_OPTIONS.SURVEYS.UUID] !== undefined && !String(argv[CLI_OPTIONS.SURVEYS.UUID]).trim()) {
              throw new ValidationError(`${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.SURVEYS.UUID)} value must not be empty`);
            }
            return true;
          })
          .example(`$0 ${COMMANDS.SURVEYS} ${SUB_COMMANDS.SURVEYS.LIST}`, 'List all surveys')
          .example(
            `$0 ${COMMANDS.SURVEYS} ${SUB_COMMANDS.SURVEYS.LIST} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.PROFILE)} caspian-prod`,
            'List surveys using caspian-prod profile'
          )
          .example(
            `$0 ${COMMANDS.SURVEYS} ${SUB_COMMANDS.SURVEYS.LIST} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.SURVEYS.NAME)} feedback`,
            'Filter survey programs by name'
          )
          .example(
            `$0 ${COMMANDS.SURVEYS} ${SUB_COMMANDS.SURVEYS.LIST} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.SURVEYS.UUID)} f0473723-45f0-4397-b39e-d2bf3d955a20`,
            'Filter survey programs by UUID'
          );
      })

      // Translations command
      .command(`${COMMANDS.TRANSLATIONS} <action>`, 'Translation operations', yargs => {
        return (
          yargs
            .positional('action', {
              describe: 'Action to perform',
              choices: [SUB_COMMANDS.TRANSLATIONS.DOWNLOAD, SUB_COMMANDS.TRANSLATIONS.UPLOAD],
              demandOption: true,
            })
            .option(CLI_OPTIONS.PROFILE, {
              type: 'string',
              description: 'Profile to use',
              default: PROFILE_DEFAULTS.NAME,
            })
            // Download-specific options
            .option(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID, {
              type: 'array',
              description: 'UUID(s) of the survey program(s) (download only). Supports multiple values.',
              requiresArg: true,
            })
            .option(CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME, {
              type: 'array',
              description: 'Name(s) of the survey program(s) (download only). Supports multiple values.',
              requiresArg: true,
            })
            .option(CLI_OPTIONS.TRANSLATIONS.LANGUAGES, {
              type: 'string',
              description: `Comma-separated list of translation languages. Defaults to ${CLI_OPTIONS.PROFILE} config, or "${PROFILE_DEFAULTS.LANGUAGES}" if not set. (download only)`,
              requiresArg: false,
            })
            .option(CLI_OPTIONS.TRANSLATIONS.OUTPUT_PATH, {
              type: 'string',
              description: `Directory to save the file(s). Defaults to ${CLI_OPTIONS.PROFILE} config, or "${PROFILE_DEFAULTS.OUTPUT_PATH}" if not set. (download only)`,
              requiresArg: false,
            })
            .option(CLI_OPTIONS.TRANSLATIONS.INCLUDE_HTML_BLOCKS, {
              type: 'boolean',
              description: `Include HTML blocks records in the translations output. Defaults to ${CLI_OPTIONS.PROFILE} config, or "${PROFILE_DEFAULTS.INCLUDE_HTML_BLOCKS}" if not set. (download only)`,
            })
            .option(CLI_OPTIONS.TRANSLATIONS.SAVE_DEBUG_FILES, {
              type: 'boolean',
              description:
                'Save debug files for troubleshooting: API responses, processed files, and survey spec details',
              default: PROFILE_DEFAULTS.SAVE_DEBUG_FILES,
            })
            // Upload-specific options
            .option(CLI_OPTIONS.TRANSLATIONS.FILE, {
              type: 'string',
              description: 'Path to the translation file to upload (upload only)',
              requiresArg: true,
            })
            .option(CLI_OPTIONS.TRANSLATIONS.PRETEND_UPLOAD, {
              type: 'boolean',
              description:
                'Do not actually commit the changes, but run everything else (upload only)',
              default: PROFILE_DEFAULTS.PRETEND_UPLOAD,
              alias: CLI_OPTIONS.TRANSLATIONS.DRY_RUN,
            })
            .check(argv => {
              const action = argv.action;
              if (action === SUB_COMMANDS.TRANSLATIONS.DOWNLOAD) {
                if (
                  !argv[CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID] &&
                  !argv[CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME]
                ) {
                  throw new ValidationError(
                    `For download: either ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)} or ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME)} must be provided`
                  );
                }
              }

              // Guard against blank values like --survey-uuid ""
              const uuids = argv[CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID];
              if (uuids?.some(v => !String(v).trim())) {
                throw new ValidationError(`${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)} values must not be empty`);
              }
              const names = argv[CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME];
              if (names?.some(v => !String(v).trim())) {
                throw new ValidationError(`${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME)} values must not be empty`);
              }

              if (action === SUB_COMMANDS.TRANSLATIONS.UPLOAD) {
                if (!argv[CLI_OPTIONS.TRANSLATIONS.FILE]) {
                  throw new ValidationError(
                    `For upload: ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.FILE)} must be provided`
                  );
                }
              }

              return true;
            })
            .example(
              `$0 ${COMMANDS.TRANSLATIONS} ${SUB_COMMANDS.TRANSLATIONS.DOWNLOAD} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)} f0473723-45f0-4397-b39e-d2bf3d955a20`,
              'Download translations by UUID'
            )
            .example(
              `$0 ${COMMANDS.TRANSLATIONS} ${SUB_COMMANDS.TRANSLATIONS.DOWNLOAD} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)} f0473723-45f0-4397-b39e-d2bf3d955a20 ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)} g0473723-45f0-4397-b39e-d2bf3d955a21 ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_UUID)} h0473723-45f0-4397-b39e-d2bf3d955a22`,
              'Download translations for multiple surveys by UUID'
            )
            .example(
              `$0 ${COMMANDS.TRANSLATIONS} ${SUB_COMMANDS.TRANSLATIONS.DOWNLOAD} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME)} "Customer Feedback"`,
              'Download translations by name'
            )
            .example(
              `$0 ${COMMANDS.TRANSLATIONS} ${SUB_COMMANDS.TRANSLATIONS.DOWNLOAD} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME)} "Customer Feedback" ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.SURVEY_NAME)} "Product Survey"`,
              'Download translations for multiple surveys by name'
            )
            .example(
              `$0 ${COMMANDS.TRANSLATIONS} ${SUB_COMMANDS.TRANSLATIONS.UPLOAD} ${CLI_OPTIONS.WITH_PREFIX(CLI_OPTIONS.TRANSLATIONS.FILE)}  ./my-translations.xlsx`,
              'Upload translations file'
            )
        );
      })

      // Global options
      .option(CLI_OPTIONS.VERBOSE, {
        alias: CLI_OPTIONS.VERBOSE_SHORT,
        type: 'boolean',
        description: 'Run with verbose logging',
        global: true,
      })
      .options(CLI_OPTIONS.DEBUG, {
        alias: CLI_OPTIONS.DEBUG_SHORT,
        type: 'boolean',
        description: 'Run with debug mode for troubleshooting',
        global: true,
      })
      .help()
      .alias(CLI_OPTIONS.HELP, CLI_OPTIONS.HELP_SHORT)
  );
}

/**
 * Parse command line arguments using yargs
 * This is the main function that should be used by the CommandRegistry
 */
export function parseWithYargs(): ParsedCommand {
  const argv: Arguments<CliArgs> = createYargsParser().parseSync();

  return {
    command: argv._[0] as string,
    subcommand: argv._[1] as string,
    options: argv,
  };
}
