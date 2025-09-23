import { FileSystemAdapter } from './adapters/fs';
import { HttpAdapter } from './adapters/http';
import { ConfigService } from './config';
import { Profile } from './config/types';
import { SurveysService } from './services/surveys';
import { TranslationsService } from './services/translations';

/**
 * Dependency Injection Container for Core Services
 */
export class CoreContainer {
  private configService: ConfigService;
  private httpAdapter: HttpAdapter;
  private fsAdapter: FileSystemAdapter;
  private initialized = false;

  constructor() {
    this.fsAdapter = new FileSystemAdapter();
    this.httpAdapter = new HttpAdapter();
    this.configService = new ConfigService(this.fsAdapter);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.configService.initialize();
    this.initialized = true;
  }

  getConfigService(): ConfigService {
    return this.configService;
  }

  async getSurveyService(profile: Profile): Promise<SurveysService> {
    const httpClient = this.httpAdapter.createClient(profile.baseUrl);
    return new SurveysService(profile, httpClient);
  }

  async getTranslationService(profile: Profile): Promise<TranslationsService> {
    const httpClient = this.httpAdapter.createClient(profile.baseUrl);
    // Create a dedicated surveys service instance for the translation service
    const surveysService = new SurveysService(profile, httpClient);
    return new TranslationsService(profile, httpClient, surveysService);
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }
}
