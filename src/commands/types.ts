import { Arguments } from 'yargs';

import { CoreContainer } from '../core';
import { UI } from '../ui';

export interface CommandContext {
  core: CoreContainer;
  ui: UI;
  args: string[];
  options: Arguments<CliArgs>;
}

export interface ICommand {
  name: string;
  description: string;
  execute(context: CommandContext): Promise<void>;
}

export interface CliArgs {
  // Global flags
  verbose?: boolean;
  debug?: boolean;

  // Profile config
  profile?: string;
  'token-url'?: string;
  'client-id'?: string;
  'client-secret'?: string;
  'api-gateway-url'?: string;
  languages?: string;
  'output-path'?: string;
  'include-html-blocks'?: boolean;
  quick?: boolean;

  // Profiles command
  action?: string;
  name?: string;
  detailed?: boolean;

  // Surveys command
  uuid?: string;

  // Translations command
  'survey-uuid'?: string[];
  'survey-name'?: string[];
  'save-debug-files'?: boolean;
  file?: string;
  'pretend-upload'?: boolean;
  'dry-run'?: boolean;
}
