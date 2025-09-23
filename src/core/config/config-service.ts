import { ProfileNotFoundError } from '../../utils/errors';
import { FileSystemAdapter } from '../adapters/fs';

import { PROFILE_DEFAULTS } from './constants';
import { ProfileManager } from './profiles';
import { ProfileConfig, Profile } from './types';
import { validateProfileConfig, validateProfileName } from './validation';

export class ConfigService {
  constructor(private fsAdapter: FileSystemAdapter) {}

  async initialize(): Promise<void> {
    await this.fsAdapter.ensureConfigDirectory();
    await this.fsAdapter.ensureSecureProfilesFile();
  }

  async saveProfile(name: string, config: ProfileConfig): Promise<void> {
    validateProfileName(name);
    validateProfileConfig(config);

    const profiles = await this.loadProfiles();
    profiles[name] = ProfileManager.mergeConfigs(PROFILE_DEFAULTS.PROFILE_TEMPLATE, config);
    await this.fsAdapter.writeProfiles(profiles);
  }

  /**
   * Get profile configuration by name
   * @throws ProfileNotFoundError if profile doesn't exist
   */
  async getProfile(name: string): Promise<ProfileConfig> {
    const profiles = await this.loadProfiles();
    const profile = profiles[name];

    if (!profile) {
      const availableProfiles = Object.keys(profiles);
      throw new ProfileNotFoundError(name, availableProfiles);
    }

    return profile;
  }

  /**
   * Get profile configuration by name, returns undefined if not found (safe version)
   */
  async findProfile(name: string): Promise<ProfileConfig | undefined> {
    const profiles = await this.loadProfiles();
    return profiles[name];
  }

  /**
   * Convert profile configuration to service-ready Profile format
   * @throws ProfileNotFoundError if profile doesn't exist
   * @throws ConfigurationError if profile is incomplete
   */
  async getServiceProfile(name: string): Promise<Profile> {
    const config = await this.getProfile(name); // This throws if not found

    return ProfileManager.configToProfile(name, config);
  }

  /**
   * Check if profile exists and is complete
   */
  async isProfileReady(name: string): Promise<boolean> {
    try {
      const config = await this.findProfile(name);
      return config ? ProfileManager.isProfileComplete(config) : false;
    } catch {
      return false;
    }
  }

  /**
   * List all profile names
   */
  async listProfiles(): Promise<string[]> {
    const profiles = await this.loadProfiles();
    return Object.keys(profiles);
  }

  /**
   * Get all profiles with their configurations (for detailed operations)
   */
  async getAllProfiles(): Promise<Record<string, ProfileConfig>> {
    return await this.loadProfiles();
  }

  /**
   * Delete a profile
   * @throws ProfileNotFoundError if profile doesn't exist
   */
  async deleteProfile(name: string): Promise<void> {
    const profiles = await this.loadProfiles();

    if (!profiles[name]) {
      const availableProfiles = Object.keys(profiles);
      throw new ProfileNotFoundError(name, availableProfiles);
    }

    delete profiles[name];
    await this.fsAdapter.writeProfiles(profiles);
  }

  /**
   * Check if a profile exists
   */
  async hasProfile(name: string): Promise<boolean> {
    const profiles = await this.loadProfiles();
    return name in profiles;
  }

  private async loadProfiles(): Promise<Record<string, ProfileConfig>> {
    return await this.fsAdapter.readProfiles();
  }
}
