import inquirer from 'inquirer';

import { PROFILE_DEFAULTS, EMOJIS } from '../../core/config/constants';
import { log } from '../../utils';

import { TranslationOptionsResult, PromptResult } from './types';

// TODO: Write interactive mode or delete this file
export class TranslationPrompt {
  async promptForDownloadOptions(): Promise<PromptResult<TranslationOptionsResult>> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includeHtmlBlocks',
        message: 'Include HTML blocks in translation export?',
        default: PROFILE_DEFAULTS.INCLUDE_HTML_BLOCKS,
      },
      {
        type: 'input',
        name: 'outputPath',
        message: 'Output directory:',
        default: PROFILE_DEFAULTS.OUTPUT_PATH,
      },
      {
        type: 'input',
        name: 'languages',
        message: 'Languages (comma-separated):',
        default: PROFILE_DEFAULTS.LANGUAGES,
        filter: (input: string) => input.split(',').map(s => s.trim()),
      },
    ]);

    return { success: true, data: answers };
  }

  async confirmUpload(filePath: string): Promise<PromptResult<boolean>> {
    log.warn(`${EMOJIS.WARNING} You are about to upload: ${filePath}`);

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you sure you want to proceed with the upload?',
        default: false,
      },
    ]);

    return { success: true, data: confirmed };
  }
}
