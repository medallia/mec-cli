import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import { log } from '../../../utils';
import { EMOJIS } from '../../config/constants';
import { Profile } from '../../config/types';

// Profile management for authentication
const profileStore: Map<string, Profile> = new Map();
const tokenStore: Map<string, { token: string; expiry: Date }> = new Map();

export class RequestInterceptor {
  /**
   * Authenticate requests by adding Bearer token
   */
  static async authenticate(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    const baseURL = config.baseURL || '';
    const profile = profileStore.get(baseURL);

    if (!profile) {
      return config; // No profile configured, skip auth
    }

    // Get or refresh token
    const token = await RequestInterceptor.getValidToken(baseURL, profile);

    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  }

  /**
   * Get valid token, refresh if needed
   */
  private static async getValidToken(baseURL: string, profile: Profile): Promise<string> {
    const tokenData = tokenStore.get(baseURL);

    // Check if current token is still valid
    if (tokenData && tokenData.expiry > new Date()) {
      return tokenData.token;
    }

    // Token expired or missing, get new one
    return await RequestInterceptor.fetchNewToken(baseURL, profile);
  }

  /**
   * Fetch new OAuth2 token
   */
  private static async fetchNewToken(baseURL: string, profile: Profile): Promise<string> {
    try {
      log.info(`${EMOJIS.LOADING} Authenticating...`);

      const credentials = Buffer.from(
        `${profile.oauth2.clientId}:${profile.oauth2.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        profile.oauth2.tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const { access_token, expires_in } = response.data;

      // Store token with 5-minute buffer
      const expiry = new Date(Date.now() + (expires_in - 300) * 1000);
      tokenStore.set(baseURL, { token: access_token, expiry });

      log.info(`${EMOJIS.SUCCESS} Authentication successful`);
      return access_token;
    } catch (error) {
      console.log(error);
      const message = error instanceof Error ? error.message : 'Unknown';
      log.error(
        `${EMOJIS.ERROR} Authentication failed`,
        message
      );
      throw new Error(`Authentication failed: ${message}`);
    }
  }

  /**
   * Register profile for authentication
   */
  static setProfile(baseURL: string, profile: Profile): void {
    profileStore.set(baseURL, profile);
    // Clear any existing token when profile changes
    tokenStore.delete(baseURL);
  }

  static handleError(error: unknown): Promise<never> {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`${EMOJIS.ERROR} API request failed`, message);
    return Promise.reject(error);
  }
}

export class ResponseInterceptor {
  static handleSuccess(response: AxiosResponse): AxiosResponse {
    return response;
  }

  /**
   * Handle 401 errors with single retry
   */
  static async handleError(error: unknown): Promise<AxiosResponse | never> {
    if (axios.isAxiosError(error)) {
      // Extend config type with optional _retry flag
      const axiosError = error as AxiosError & {
        config: AxiosRequestConfig & { _retry?: boolean };
      };

      // Handle 401 Unauthorized (token expired)
      if (axiosError.response?.status === 401 && !axiosError.config._retry) {
        log.info(`${EMOJIS.WARNING} Token expired, refreshing...`);

        const baseURL = axiosError.config.baseURL || '';
        tokenStore.delete(baseURL); // Clear expired token
        axiosError.config._retry = true; // Mark request for retry

        // Retry the request (interceptor should attach a new token)
        return axios.request(axiosError.config);
      }
    }

    // For all other errors, log and reject
    const message = error instanceof Error ? error.message : String(error);
    log.error(`${EMOJIS.ERROR} API request failed`, message);
    return Promise.reject(error);
  }
}

// Export for services
export const TokenManager = {
  setProfile: RequestInterceptor.setProfile,
  clearToken: (baseURL: string) => tokenStore.delete(baseURL),
};
