import * as fs from 'fs';

import { FILE_EXTENSIONS, FILE_SIZE_LIMITS } from '../../config/constants';

import { PathUtils } from './paths';

export class FileValidator {
  /**
   * Check if file is a valid Excel file
   */
  static isValidExcelFile(filePath: string): boolean {
    const extension = PathUtils.getFileExtension(filePath);
    return (
      extension === FILE_EXTENSIONS.EXCEL &&
      PathUtils.fileExists(filePath) &&
      this.isFileSizeAcceptable(filePath, FILE_SIZE_LIMITS.MAX_EXCEL_FILE_SIZE)
    );
  }

  /**
   * Check if file is a valid JSON file
   */
  static isValidJsonFile(filePath: string): boolean {
    try {
      if (!PathUtils.fileExists(filePath)) {
        return false;
      }

      const extension = PathUtils.getFileExtension(filePath);
      if (extension !== FILE_EXTENSIONS.JSON) {
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if file is a valid INI file
   */
  static isValidIniFile(filePath: string): boolean {
    try {
      if (!PathUtils.fileExists(filePath)) {
        return false;
      }

      const extension = PathUtils.getFileExtension(filePath);
      if (extension !== FILE_EXTENSIONS.INI) {
        return false;
      }

      // Basic INI validation - check for sections and key=value pairs
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      let hasSection = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
          continue;
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          hasSection = true;
        } else if (trimmed.includes('=')) {
          // Valid key=value pair
          continue;
        } else {
          // Invalid line format
          return false;
        }
      }

      return hasSection;
    } catch {
      return false;
    }
  }

  /**
   * Validate file permissions for reading
   */
  static canReadFile(filePath: string): boolean {
    try {
      if (!PathUtils.fileExists(filePath)) {
        return false;
      }

      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate file permissions for writing
   */
  static canWriteFile(filePath: string): boolean {
    try {
      // If file exists, check write permission
      if (PathUtils.fileExists(filePath)) {
        fs.accessSync(filePath, fs.constants.W_OK);
        return true;
      }

      // If file doesn't exist, check if we can write to the directory
      const dirPath = PathUtils.getDirectoryName(filePath);
      if (PathUtils.directoryExists(dirPath)) {
        fs.accessSync(dirPath, fs.constants.W_OK);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Validate file size is within acceptable limits
   */
  static isFileSizeAcceptable(
    filePath: string,
    maxSizeBytes: number = FILE_SIZE_LIMITS.MAX_UPLOAD_FILE_SIZE
  ): boolean {
    try {
      if (!PathUtils.fileExists(filePath)) {
        return false;
      }

      const stats = fs.statSync(filePath);
      return stats.size <= maxSizeBytes;
    } catch {
      return false;
    }
  }

  /**
   * Validate directory permissions
   */
  static canAccessDirectory(dirPath: string): boolean {
    try {
      if (!PathUtils.directoryExists(dirPath)) {
        return false;
      }

      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Comprehensive file validation
   */
  static validateFile(
    filePath: string,
    options: {
      checkExists?: boolean;
      checkReadable?: boolean;
      checkWritable?: boolean;
      expectedExtension?: string;
      maxSize?: number;
    } = {}
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if file exists
    if (options.checkExists !== false && !PathUtils.fileExists(filePath)) {
      errors.push(`File does not exist: ${filePath}`);
    }

    // If file doesn't exist, skip other checks
    if (!PathUtils.fileExists(filePath)) {
      return { isValid: errors.length === 0, errors };
    }

    // Check file extension
    if (options.expectedExtension) {
      const actualExtension = PathUtils.getFileExtension(filePath);
      if (actualExtension !== options.expectedExtension.toLowerCase()) {
        errors.push(`Expected ${options.expectedExtension} file, got ${actualExtension}`);
      }
    }

    // Check readability
    if (options.checkReadable && !this.canReadFile(filePath)) {
      errors.push(`File is not readable: ${filePath}`);
    }

    // Check writability
    if (options.checkWritable && !this.canWriteFile(filePath)) {
      errors.push(`File is not writable: ${filePath}`);
    }

    // Check file size
    if (options.maxSize && !this.isFileSizeAcceptable(filePath, options.maxSize)) {
      errors.push(`File size exceeds maximum allowed: ${filePath}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize filename for cross-platform compatibility
   */
  static sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '_');
  }
}
