import inquirer from 'inquirer';

import { EMOJIS } from '../../core/config/constants';
import { SurveyItem } from '../../core/services/surveys/types';
import { log } from '../../utils';

import { SurveySelectionResult, PromptResult } from './types';

// TODO: Write interactive mode or delete this file
export class SurveyPrompt {
  async selectSurvey(surveys: SurveyItem[]): Promise<PromptResult<SurveySelectionResult>> {
    if (surveys.length === 0) {
      log.warn(`${EMOJIS.WARNING} No surveys found`);
      return { success: false };
    }

    const choices = surveys.map(survey => ({
      name: `${survey.name} (${survey.id})`,
      value: survey,
      short: survey.name,
    }));

    const { selectedSurvey } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedSurvey',
        message: 'Select a survey:',
        choices,
        pageSize: 10,
      },
    ]);

    return {
      success: true,
      data: {
        surveyId: selectedSurvey.id,
        surveyName: selectedSurvey.name,
      },
    };
  }

  async promptForSearchTerm(): Promise<PromptResult<string>> {
    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: 'Enter search term for surveys:',
        validate: (input: string) => {
          if (!input || input.trim().length < 1) {
            return 'Search term is required';
          }
          return true;
        },
      },
    ]);

    return { success: true, data: searchTerm };
  }
}
