import { CoreContainer } from '../core';
import { UI } from '../ui';
import { parseWithYargs } from '../ui/parser';
import { CLIError } from '../utils/errors';

import { ConfigureCommand } from './configure';
import { ProfilesCommand } from './profiles';
import { SurveysCommand } from './surveys';
import { TranslationsCommand } from './translations';
import { ICommand, CommandContext } from './types';

export class CommandRegistry {
  private commands: Map<string, ICommand> = new Map();

  constructor(
    private core: CoreContainer,
    private ui: UI
  ) {
    this.registerCommands();
  }

  private registerCommands(): void {
    const commands = [
      new ConfigureCommand(),
      new ProfilesCommand(),
      new SurveysCommand(),
      new TranslationsCommand(),
    ];

    commands.forEach(command => {
      this.commands.set(command.name, command);
    });
  }

  async execute(): Promise<void> {
    // Let yargs handle all parsing, validation, help, and version
    const { command, options } = parseWithYargs();

    const commandHandler = this.commands.get(command);
    if (!commandHandler) {
      // This shouldn't happen since yargs validates commands
      throw new CLIError(`Command handler not found: ${command}`, 'COMMAND_NOT_FOUND', 1);
    }

    const context: CommandContext = {
      core: this.core,
      ui: this.ui,
      args: process.argv,
      options,
    };

    await commandHandler.execute(context);
  }

  getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}
