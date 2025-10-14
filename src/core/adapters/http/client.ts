import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { log } from '../../../utils';
import { API_DEFAULTS, APP_NAME, APP_VERSION } from '../../config/constants';
import { Profile } from '../../config/types';

import { RequestInterceptor, ResponseInterceptor, TokenManager } from './interceptors';

export class HttpClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string, options: { enableAuth?: boolean } = {}) {
    const { enableAuth = true } = options;
    
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: API_DEFAULTS.TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `${APP_NAME}/${APP_VERSION}`,
      },
    });

    if (enableAuth) {
      this.setupInterceptors();
    }
  }

  static createUnauthenticated(baseURL: string): HttpClient {
    return new HttpClient(baseURL, { enableAuth: false });
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      RequestInterceptor.authenticate,
      RequestInterceptor.handleError
    );

    this.client.interceptors.response.use(
      ResponseInterceptor.handleSuccess,
      ResponseInterceptor.handleError
    );
  }

  /**
   * Set authentication profile
   */
  setProfile(profile: Profile): void {
    TokenManager.setProfile(this.baseURL, profile);
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    TokenManager.clearToken(this.baseURL);
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const url = config.url?.startsWith('http') ? config.url : `${this.baseURL}${config.url}`;
    log.info(`HTTP ${config.method?.trim().toUpperCase() || 'GET'} ${url}`);

    // Define retry logic for specific error conditions
    const shouldRetry = (error: AxiosError | NodeJS.ErrnoException): boolean => {
      // Retry on network errors
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        return true;
      }

      // Retry on specific HTTP status codes
      if ('response' in error && error.response?.status) {
        const status = error.response.status;
        // Only retry on server errors (5xx) and rate limiting (429)
        return status >= 500 || status === 429;
      }

      return false;
    };

    // Retry loop
    for (let attempt = 1; attempt <= API_DEFAULTS.RETRY_MAX_ATTEMPTS; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return response.data;
      } catch (error) {
        const isAxiosError = axios.isAxiosError(error);
        const isNodeError = error && typeof error === 'object' && error !== null && 'code' in error;

        if (isAxiosError || isNodeError) {
          const typedError = error as AxiosError | NodeJS.ErrnoException;

          // Check if we should retry and if we have attempts left
          if (shouldRetry(typedError) && attempt < API_DEFAULTS.RETRY_MAX_ATTEMPTS) {
            log.warn(
              `Request failed (attempt ${attempt}/${API_DEFAULTS.RETRY_MAX_ATTEMPTS}), will retry: ${typedError.message}`
            );
            // Wait before retrying
            await new Promise(resolve =>
              setTimeout(resolve, API_DEFAULTS.RETRY_DELAY_MS * attempt)
            );
            continue;
          }

          // No retry or final attempt
          log.error(`Request failed (no retry): ${typedError.message}`);
          throw typedError;
        }

        // Fallback for unknown errors
        log.error(`Unexpected error: ${error}`);
        throw error;
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Request failed after all attempts');
  }
}
