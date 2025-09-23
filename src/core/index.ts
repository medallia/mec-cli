// Core container is the main export
export { CoreContainer } from './container';

// Essential configuration services
export { ConfigService } from './config/config-service';
export { ProfileManager } from './config/profiles';

// Business services
export { SurveysService, TranslationsService } from './services';

// Core types
export type { Profile, ProfileConfig, ProfileSummary } from './config/types';
export type { SurveyItem } from './services/surveys/types';
export type {
  DownloadTranslationsOptions,
  UploadTranslationsOptions,
} from './services/translations/types';

// Constants needed by commands and utilities
export { APP_NAME, COMMANDS, ERROR_CODES } from './config/constants';
