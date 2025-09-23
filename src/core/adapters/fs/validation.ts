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
   * Sanitize filename for cross-platform compatibility
   */
  static sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '_');
  }
}
