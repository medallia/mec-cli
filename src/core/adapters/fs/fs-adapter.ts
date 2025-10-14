import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { CONFIG_DIR_NAME, PROFILE_KEYS, PROFILES_FILE_NAME } from '../../config/constants';
import { ProfileConfig } from '../../config/types';

import { PathUtils } from './paths';
import { FileValidator } from './validation';

export class FileSystemAdapter {
  private getProfilesPath(): string {
    return path.join(os.homedir(), CONFIG_DIR_NAME, PROFILES_FILE_NAME);
  }

  async ensureConfigDirectory(): Promise<void> {
    const configDir = path.dirname(this.getProfilesPath());

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  async ensureSecureProfilesFile(): Promise<void> {
    const profilesPath = this.getProfilesPath();
    const ownerReadWriteOnly = 0o600; // Owner can read/write, others have no access

    if (fs.existsSync(profilesPath)) {
      fs.chmodSync(profilesPath, ownerReadWriteOnly);
    } else {
      fs.writeFileSync(profilesPath, '', { mode: ownerReadWriteOnly });
    }
  }

  async readProfiles(): Promise<Record<string, ProfileConfig>> {
    const profilesPath = this.getProfilesPath();

    if (!fs.existsSync(profilesPath)) {
      return {};
    }

    const content = fs.readFileSync(profilesPath, 'utf-8');
    return this.parseINI(content);
  }

  async writeProfiles(profiles: Record<string, ProfileConfig>): Promise<void> {
    const profilesPath = this.getProfilesPath();
    const content = this.serializeToINI(profiles);

    fs.writeFileSync(profilesPath, content, 'utf-8');
  }

  async validateExcelFile(filePath: string): Promise<boolean> {
    return FileValidator.isValidExcelFile(filePath);
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    return PathUtils.ensureDirectory(dirPath);
  }

  realpathSync(binPath: string) {
    return fs.realpathSync(binPath);
  }

  // Additional file operations for general use
  readFileSync(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
    return fs.readFileSync(filePath, encoding);
  }

  writeFileSync(filePath: string, data: Buffer | string, encoding?: string): void {
    fs.writeFileSync(filePath, data, encoding as fs.WriteFileOptions);
  }

  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  createReadStream(filePath: string): fs.ReadStream {
    return fs.createReadStream(filePath);
  }

  deleteFileSync(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getTempFilePath(fileName: string): string {
    return path.join(os.tmpdir(), fileName);
  }

  private parseINI(content: string): Record<string, ProfileConfig> {
    const profiles: Record<string, ProfileConfig> = {};
    let currentProfile = '';

    content.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) {
        return;
      }

      if (line.startsWith('[') && line.endsWith(']')) {
        currentProfile = line.slice(1, -1);
        profiles[currentProfile] = {};
      } else if (currentProfile && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const trimmedKey = key.trim();
        const value = valueParts.join('=').trim();

        if (trimmedKey === PROFILE_KEYS.INCLUDE_HTML_BLOCKS) {
          profiles[currentProfile].includeHtmlBlocks = value.toLowerCase() === 'true';
        } else {
          const profileKey = trimmedKey as keyof Omit<ProfileConfig, 'includeHtmlBlocks'>;
          (profiles[currentProfile] as ProfileConfig)[profileKey] = value;
        }
      }
    });

    return profiles;
  }

  private serializeToINI(profiles: Record<string, ProfileConfig>): string {
    let content = '';
    Object.entries(profiles).forEach(([name, config]) => {
      content += `[${name}]\n`;
      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          content += `${key}=${value}\n`;
        }
      });
      content += '\n';
    });
    return content;
  }
}
