import { EMOJIS } from '../../core/config/constants';
import { Colors } from './colors';

export class OutputFormatter {
  formatSuccess(message: string): string {
    return Colors.success(`${EMOJIS.SUCCESS} ${message}`);
  }

  formatError(message: string): string {
    return Colors.error(`${EMOJIS.ERROR}  ${message}`);
  }

  formatWarning(message: string): string {
    return Colors.warning(`${EMOJIS.WARNING}  ${message}`);
  }

  formatInfo(message: string): string {
    return Colors.info(`${EMOJIS.INFO}  ${message}`);
  }

  formatHighlight(text: string): string {
    return Colors.accent(text);
  }

  formatDim(text: string): string {
    return Colors.muted(text);
  }

  formatBold(text: string): string {
    return Colors.emphasis(text);
  }

  formatCode(text: string): string {
    return Colors.code(` ${text} `);
  }

  formatUrl(url: string): string {
    return Colors.link(url);
  }

  createSeparator(char: string = '─', length: number = 50): string {
    return Colors.muted(char.repeat(length));
  }

  createHeader(title: string): string {
    const separator = this.createSeparator('═', title.length + 4);
    return Colors.info(`${separator}\n  ${title.toUpperCase()}  \n${separator}`);
  }

  createSection(title: string, content: string[]): string {
    let output = Colors.info(`\n${EMOJIS.INFO} ${title}:\n`);
    content.forEach(line => {
      output += `  ${line}\n`;
    });
    return output;
  }
}
