import { ValidationError } from '../../utils/errors';

import { VALIDATION } from './constants';
import { ProfileConfig } from './types';

export function validateProfileConfig(config: ProfileConfig): void {
  const errors: string[] = [];

  if (!config.tokenUrl || !VALIDATION.URL.PATTERN.test(config.tokenUrl)) {
    errors.push('Valid tokenUrl is required');
  }

  if (!config.oAuthClientId || config.oAuthClientId.length < 1) {
    errors.push('oAuthClientId is required');
  }

  if (!config.oAuthClientSecret || config.oAuthClientSecret.length < 1) {
    errors.push('oAuthClientSecret is required');
  }

  if (!config.apiGatewayUrl || !VALIDATION.URL.PATTERN.test(config.apiGatewayUrl)) {
    errors.push('Valid apiGatewayUrl is required');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export function validateProfileName(name: string): void {
  if (
    !VALIDATION.PROFILE_NAME.PATTERN.test(name) ||
    name.length < VALIDATION.PROFILE_NAME.MIN_LENGTH ||
    name.length > VALIDATION.PROFILE_NAME.MAX_LENGTH
  ) {
    throw new ValidationError(
      `Invalid profile name: "${name}". It must be ${VALIDATION.PROFILE_NAME.MIN_LENGTH}-${VALIDATION.PROFILE_NAME.MAX_LENGTH} characters long and match the pattern ${VALIDATION.PROFILE_NAME.PATTERN}`
    );
  }
}
