import { log } from '../../utils';
import { FileSystemAdapter, PathUtils } from '../adapters/fs';
import { HttpAdapter } from '../adapters/http';

import {
  APP_NAME,
  APP_VERSION,
  VERSION_CHECK,
  CONFIG_DIR_NAME,
  VERSION_CACHE_FILE_NAME,
  APP_REPOSITORY,
} from './constants';
import { VersionInfo, VersionCheckCache, InstallationMethod, GitHubReleaseResponse } from './types';

// Constants for installation path detection
const INSTALLATION_PATHS = {
  HOMEBREW: ['/opt/homebrew', '/usr/local/Cellar', '/homebrew/'],
  NODE_MODULES: ['node_modules'],
  NODE_EXECUTABLE: ['node'],
} as const;

export class VersionService {
  private fsAdapter: FileSystemAdapter;
  private httpAdapter: HttpAdapter;
  private cacheFilePath: string;

  constructor() {
    this.fsAdapter = new FileSystemAdapter();
    this.httpAdapter = new HttpAdapter();
    this.cacheFilePath = PathUtils.join(
      PathUtils.getHomeDirectory(),
      CONFIG_DIR_NAME,
      VERSION_CACHE_FILE_NAME
    );
  }

  /**
   * Check if current version is outdated with caching to avoid frequent checks
   */
  async checkVersionWithCache(): Promise<VersionInfo | null> {
    try {
      const cache = await this.loadCache();
      const now = Date.now();

      // If we have a recent cache, use it
      if (cache && now - cache.lastCheckTime < VERSION_CHECK.CHECK_INTERVAL_SECS * 1000) {
        return cache.versionInfo;
      }

      // Otherwise, check for new version
      const versionInfo = await this.performVersionCheck();

      // Save to cache (preserve lastAlertShownTime if it exists)
      await this.saveCache({
        lastCheckTime: now,
        lastAlertShownTime: cache?.lastAlertShownTime,
        versionInfo,
      });

      return versionInfo;
    } catch (error) {
      log.warn('[VersionService] Version check with cache failed:', error);
      return null;
    }
  }

  /**
   * Force check current version (ignores cache)
   */
  async performVersionCheck(): Promise<VersionInfo> {
    const currentVersion = APP_VERSION;
    const githubReleaseUrl = `${APP_REPOSITORY}/releases`;

    try {
      const latestVersion = await this.getLatestVersionFromGitHub();
      const installationMethod = this.detectInstallationMethod();
      const updateInstruction = this.getUpdateInstruction(installationMethod);
      const isOutdated = this.isVersionOutdated(currentVersion, latestVersion);

      return {
        currentVersion,
        latestVersion,
        updateAvailable: isOutdated,
        installationMethod,
        changelogUrl: `${githubReleaseUrl}/tag/v${latestVersion}`,
        updateInstruction,
      };
    } catch (error) {
      log.warn('[VersionService] Version check failed:', error);

      const installationMethod = this.detectInstallationMethod();
      const updateInstruction = this.getUpdateInstruction(installationMethod);

      // Return safe defaults if version check fails
      return {
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION,
        updateAvailable: false,
        installationMethod,
        changelogUrl: githubReleaseUrl,
        updateInstruction,
      };
    }
  }

  /**
   * Get latest version from GitHub API
   */
  private async getLatestVersionFromGitHub(): Promise<string> {
    try {
      // Create HTTP client without authentication for public GitHub API
      // Using full URL as base makes it cleaner
      const httpClient = this.httpAdapter.createUnauthenticatedClient(
        VERSION_CHECK.GITHUB_API_LATEST_RELEASE_URL
      );

      const response = await httpClient.request<GitHubReleaseResponse>({
        method: 'GET',
        url: '', // Empty since we're using the full URL as base
      });

      const version = response.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
      log.info(`[VersionService] Latest version from GitHub: ${version}`);
      return version;
    } catch (error) {
      log.warn('[VersionService] Failed to fetch latest version from GitHub API:', error);
      // Silently fail on GitHub API errors, return current version as fallback
      return APP_VERSION;
    }
  }

  /**
   * Compare two version strings (simple semver comparison)
   */
  private isVersionOutdated(current: string, latest: string): boolean {
    if (current === latest) {
      return false;
    }

    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    const maxLength = Math.max(currentParts.length, latestParts.length);

    for (let i = 0; i < maxLength; i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) {
        return true;
      }
      if (latestPart < currentPart) {
        return false;
      }
    }

    return false;
  }

  /**
   * Detect how the CLI was installed
   */
  private detectInstallationMethod(): InstallationMethod {
    try {
      const execPath = process.execPath;
      const scriptPath = process.argv[1];

      // Check for npm global installation first (more specific)
      if (
        INSTALLATION_PATHS.NODE_EXECUTABLE.some(path => execPath.includes(path)) ||
        INSTALLATION_PATHS.NODE_MODULES.some(path => scriptPath?.includes(path))
      ) {
        return 'npm';
      }

      // Check script/execution paths for Homebrew installation
      if (
        INSTALLATION_PATHS.HOMEBREW.some(
          path => execPath.includes(path) || scriptPath?.includes(path)
        )
      ) {
        return 'homebrew';
      }

      return 'unknown';
    } catch (error) {
      log.warn('[VersionService] Installation method detection failed:', error);
      return 'unknown';
    }
  }

  /**
   * Get the appropriate update command/instruction based on installation method
   */
  private getUpdateInstruction(method: InstallationMethod): string {
    switch (method) {
      case 'homebrew':
        return `brew upgrade ${APP_NAME}`;
      case 'npm':
        return `npm install -g ${APP_NAME}`;
      default:
        return 'Download the latest binary from https://github.com/medallia/mec-cli/releases';
    }
  }

  /**
   * Load version check cache from file
   */
  private async loadCache(): Promise<VersionCheckCache | null> {
    try {
      if (!this.fsAdapter.existsSync(this.cacheFilePath)) {
        return null;
      }

      const content = this.fsAdapter.readFileSync(this.cacheFilePath);
      const cache = JSON.parse(content) as VersionCheckCache;

      // Validate cache structure
      if (!cache.lastCheckTime || !cache.versionInfo) {
        log.warn('[VersionService] Invalid cache structure, ignoring cache');
        return null;
      }

      return cache;
    } catch (error) {
      log.warn('[VersionService] Failed to load version check cache:', error);
      return null;
    }
  }

  /**
   * Save version check cache to file
   */
  private async saveCache(cache: VersionCheckCache): Promise<void> {
    try {
      // Ensure config directory exists
      await this.fsAdapter.ensureConfigDirectory();

      // Write cache file
      this.fsAdapter.writeFileSync(this.cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error) {
      log.warn('[VersionService] Failed to save version check cache:', error);
    }
  }

  /**
   * Check if we should show the update alert (respects silence duration)
   */
  async shouldShowAlert(versionInfo: VersionInfo): Promise<boolean> {
    if (!versionInfo.updateAvailable) {
      return false;
    }

    try {
      const cache = await this.loadCache();
      const now = Date.now();

      // If we haven't shown an alert before, show it
      if (!cache?.lastAlertShownTime) {
        return true;
      }

      // Check if enough time has passed since the last alert
      return now - cache.lastAlertShownTime >= VERSION_CHECK.SILENCE_ALERT_DURATION_SECS * 1000;
    } catch (error) {
      log.warn('[VersionService] Failed to check alert show status:', error);
      // On error, default to showing the alert
      return true;
    }
  }

  /**
   * Mark that we've shown an alert (updates the cache)
   */
  async markAlertShown(): Promise<void> {
    try {
      const cache = await this.loadCache();
      if (cache) {
        await this.saveCache({
          ...cache,
          lastAlertShownTime: Date.now(),
        });
      }
    } catch (error) {
      log.warn('[VersionService] Failed to mark alert as shown:', error);
    }
  }
}
