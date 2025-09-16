import { APP_NAME, COMMANDS, ERROR_CODES } from '../core';

/**
 * Custom error classes for the MEC CLI application
 */
export class ProfileNotFoundError extends Error {
  constructor(profileName: string, availableProfiles: string[]) {
    if (availableProfiles.length > 0) {
      super(
        `Profile "${profileName}" not found or not properly configured. Available profiles: ${availableProfiles.join(', ')}`
      );
    } else {
      super(`No profiles found. Use "${APP_NAME} ${COMMANDS.CONFIGURE}" to set up a new profile.`);
    }
    this.name = 'ProfileNotFoundError';
  }
}

export class CLIError extends Error {
  public readonly code: string;
  public readonly exitCode: number;

  constructor(message: string, code: string = 'CLI_ERROR', exitCode: number = 1) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

export class ConfigurationError extends CLIError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', ERROR_CODES.CONFIG_ERROR);
    this.name = 'ConfigurationError';
  }
}

export class AuthenticationError extends CLIError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', ERROR_CODES.AUTH_ERROR);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends CLIError {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message, 'NETWORK_ERROR', ERROR_CODES.NETWORK_ERROR);
    this.name = 'NetworkError';

    // Only assign if provided to avoid unused variable warnings
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
    if (response !== undefined) {
      this.response = response;
    }
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', ERROR_CODES.VALIDATION_ERROR);
    this.name = 'ValidationError';
  }
}

/**
 * Utility function to handle and format errors for CLI output
 */
export function handleError(error: unknown): CLIError {
  if (error instanceof CLIError) {
    return error;
  }

  if (error instanceof Error) {
    return new CLIError(error.message, 'GENERAL_ERROR', ERROR_CODES.GENERAL_ERROR);
  }

  return new CLIError('An unknown error occurred', 'GENERAL_ERROR', ERROR_CODES.GENERAL_ERROR);
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}
