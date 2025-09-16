import { CommandRegistry } from '../commands';
import { CoreContainer } from '../core';
import { UI } from '../ui';
import { handleError } from '../utils/errors';

/**
 * Main CLI Application - Orchestrates the entire application
 */
export class CLIApplication {
  private coreContainer: CoreContainer;
  private ui: UI;
  private commandRegistry: CommandRegistry;

  constructor() {
    this.coreContainer = new CoreContainer();
    this.ui = new UI();
    this.commandRegistry = new CommandRegistry(this.coreContainer, this.ui);
  }

  /**
   * Main entry point for the CLI application
   */
  async run(): Promise<void> {
    try {
      // Initialize core services
      await this.coreContainer.initialize();

      // Execute command (yargs handles all parsing and validation)
      await this.commandRegistry.execute();
    } catch (error) {
      this.ui.formatters.progress.stopSpinner(); // Stop spinner in case it's running
      const cliError = handleError(error);
      this.ui.displayError(cliError.message);
      this.coreContainer.dispose();
      process.exit(cliError.exitCode);
    }
  }
}
