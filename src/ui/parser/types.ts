import { Arguments } from 'yargs';

import { CliArgs } from '../../commands/types';

export interface ParsedCommand {
  command: string;
  subcommand?: string;
  options: Arguments<CliArgs>;
}
