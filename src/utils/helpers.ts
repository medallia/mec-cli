// Helper utility functions

export const isVerboseEnabled: boolean =
  process.argv.includes('--verbose') || process.argv.includes('-v');

export function maskSecret(secret: string): string {
  if (!secret || secret.length <= 8) {
    return '****';
  }
  return (
    secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4)
  );
}
