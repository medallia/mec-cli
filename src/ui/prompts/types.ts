import { ProfileConfig } from '../../core/config/types';

export interface PromptResult<T> {
  success: boolean;
  data?: T;
  cancelled?: boolean;
  error?: string;
}

export interface ConfigurationPromptResult {
  profileName: string;
  config: ProfileConfig;
}

export type RequiredPromptAnswers = Pick<
  ProfileConfig,
  'tokenUrl' | 'oAuthClientId' | 'oAuthClientSecret' | 'apiGatewayUrl'
>;

export type OptionalPromptAnswers = Pick<
  ProfileConfig,
  'languages' | 'outputPath' | 'includeHtmlBlocks'
>;

export interface SurveySelectionResult {
  surveyId: string;
  surveyName: string;
}

export interface TranslationOptionsResult {
  includeHtmlBlocks: boolean;
  outputPath: string;
  languages: string[];
}
