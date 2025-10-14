import { CommandRegistry } from '../commands';
import { CoreContainer } from '../core';
import { VersionService } from '../core/config';
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

      // Check for version updates (non-blocking)
      this.checkForUpdates();

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

  /**
   * Check for version updates in the background
   */
  private checkForUpdates(): void {
    // Run version check asynchronously without blocking
    const versionService = new VersionService();

    versionService
      .checkVersionWithCache()
      .then(async versionInfo => {
        if (versionInfo?.updateAvailable) {
          // Check if we should show the alert (respects silence duration)
          const shouldShow = await versionService.shouldShowAlert(versionInfo);
          if (shouldShow) {
            this.ui.displayVersionUpdate(versionInfo);
            // Mark that we've shown the alert
            await versionService.markAlertShown();
          }
        }
      })
      .catch(() => {
        // Silently fail - version check errors are logged but don't block CLI execution
      });
  }
}
