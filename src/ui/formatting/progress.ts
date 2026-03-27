import { EMOJIS, UI_SETTINGS } from '../../core/config/constants';
import { isVerboseEnabled } from '../../utils';

import { Colors } from './colors';

export class ProgressFormatter {
  private spinnerIndex = 0;
  private interval?: NodeJS.Timeout;

  startSpinner(message: string): void {
    if (!isVerboseEnabled) {
      // Don't show spinner if verbose mode is enabled
      process.stdout.write(`${message} `);

      this.interval = setInterval(() => {
        process.stdout.write(
          `\r${message} ${Colors.info(UI_SETTINGS.SPINNER_CHARS[this.spinnerIndex])}`
        );
        this.spinnerIndex = (this.spinnerIndex + 1) % UI_SETTINGS.SPINNER_CHARS.length;
      }, UI_SETTINGS.SPINNER_INTERVAL);
    }
  }

  stopSpinner(message?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    if (message) {
      process.stdout.write(`\r${message}\n`);
    } else {
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
    }
  }

  displayProgress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const filledLength = Math.round((UI_SETTINGS.PROGRESS_BAR_LENGTH * current) / total);

    const bar =
      '█'.repeat(filledLength) + '░'.repeat(UI_SETTINGS.PROGRESS_BAR_LENGTH - filledLength);
    const progressText = `${message || 'Progress'}: [${Colors.success(bar)}] ${percentage}% (${current}/${total})`;

    process.stdout.write(`\r${progressText}`);

    if (current === total) {
      process.stdout.write('\n');
    }
  }

  displaySteps(steps: string[], currentStep: number): void {
    console.log(Colors.info('\nProgress:'));

    steps.forEach((step, index) => {
      const stepNum = index + 1;
      let prefix: string;

      if (stepNum < currentStep) {
        prefix = Colors.success(`${EMOJIS.SUCCESS} [${stepNum}]`);
      } else if (stepNum === currentStep) {
        prefix = Colors.warning(`${EMOJIS.LOADING} [${stepNum}]`);
      } else {
        prefix = Colors.muted(`${EMOJIS.PENDING} [${stepNum}]`);
      }

      console.log(`  ${prefix} ${step}`);
    });
    console.log('');
  }
}
