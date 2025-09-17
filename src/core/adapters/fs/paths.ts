import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { CONFIG_DIR_NAME } from '../../config/constants';

export class PathUtils {
  /**
   * Get the user's home directory
   */
  static getHomeDirectory(): string {
    return os.homedir();
  }

  /**
   * Get the config directory path
   */
  static getConfigDirectory(): string {
    return path.join(this.getHomeDirectory(), CONFIG_DIR_NAME);
  }

  /**
   * Get a file path within the config directory
   */
  static getConfigFilePath(filename: string): string {
    return path.join(this.getConfigDirectory(), filename);
  }

  /**
   * Ensure a directory exists, creating it if necessary
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Ensure the config directory exists
   */
  static async ensureConfigDirectory(): Promise<void> {
    await this.ensureDirectory(this.getConfigDirectory());
  }

  /**
   * Check if a file exists
   */
  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Check if a directory exists
   */
  static directoryExists(dirPath: string): boolean {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  /**
   * Get file extension
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * Get file name without extension
   */
  static getFileNameWithoutExtension(filePath: string): string {
    const baseName = path.basename(filePath);
    return path.parse(baseName).name;
  }

  /**
   * Get directory name from file path
   */
  static getDirectoryName(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Join path segments safely
   */
  static join(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Resolve absolute path
   */
  static resolve(filePath: string): string {
    return path.resolve(filePath);
  }

  /**
   * Ensure output directory exists for a file path
   */
  static async ensureOutputDirectory(filePath: string): Promise<void> {
    const dirPath = this.getDirectoryName(filePath);
    await this.ensureDirectory(dirPath);
  }
}
