import { isVerboseEnabled } from './helpers';

/**
 * Simple utility logger that only logs when debug mode is enabled
 * Keeps logging concerns separate from business logic
 */

export function info(message: string, data?: unknown): void {
  if (isVerboseEnabled) {
    const prefix = `[INFO]`;

    if (data !== undefined) {
      console.log(`${prefix} ${message}:`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

export function error(message: string, data?: unknown): void {
  if (isVerboseEnabled) {
    const prefix = `[ERROR]`;

    if (data !== undefined) {
      console.error(`${prefix} ${message}:`, data);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }
}

export function warn(message: string, data?: unknown): void {
  if (isVerboseEnabled) {
    const prefix = `[WARN]`;

    if (data !== undefined) {
      console.warn(`${prefix} ${message}:`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }
}

export const log = {
  info,
  error,
  warn,
};
