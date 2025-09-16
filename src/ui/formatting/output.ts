import chalk from 'chalk';

import { EMOJIS } from '../../core/config/constants';

export class OutputFormatter {
  formatSuccess(message: string): string {
    return chalk.green(`${EMOJIS.SUCCESS} ${message}`);
  }

  formatError(message: string): string {
    return chalk.red(`${EMOJIS.ERROR}  ${message}`);
  }

  formatWarning(message: string): string {
    return chalk.yellow(`${EMOJIS.WARNING}  ${message}`);
  }

  formatInfo(message: string): string {
    return chalk.cyan(`${EMOJIS.INFO}  ${message}`);
  }

  formatHighlight(text: string): string {
    return chalk.blueBright(text);
  }

  formatDim(text: string): string {
    return chalk.gray(text);
  }

  formatBold(text: string): string {
    return chalk.bold(text);
  }

  formatCode(text: string): string {
    return chalk.inverse(` ${text} `);
  }

  formatUrl(url: string): string {
    return chalk.blueBright.underline(url);
  }

  createSeparator(char: string = '─', length: number = 50): string {
    return chalk.gray(char.repeat(length));
  }

  createHeader(title: string): string {
    const separator = this.createSeparator('═', title.length + 4);
    return chalk.blue(`${separator}\n  ${title.toUpperCase()}  \n${separator}`);
  }

  createSection(title: string, content: string[]): string {
    let output = chalk.blue(`\n${EMOJIS.INFO} ${title}:\n`);
    content.forEach(line => {
      output += `  ${line}\n`;
    });
    return output;
  }
}
