import chalk from 'chalk';

/**
 * Theme-safe color utilities that work well on both dark and light terminal backgrounds
 *
 * Design principles:
 * - Avoid pure white/black colors that may be invisible
 * - Keep info colors readable on all themes
 */
export class Colors {
  // Core semantic colors (keep as requested)
  static readonly error = chalk.red; // Red for errors
  static readonly success = chalk.green; // Green for success
  static readonly warning = chalk.yellow; // Yellow for warnings

  // Theme-safe alternatives for common colors
  static readonly primary = chalk.bold;
  static readonly secondary = chalk.dim;
  static readonly info = chalk.cyan;
  static readonly accent = chalk.magenta;
  static readonly muted = chalk.gray;

  // Table-specific colors
  static readonly tableHeader = chalk.bold; // Bold
  static readonly tableContent = chalk.reset; // Default terminal color
  static readonly tableIndex = chalk.cyan;
  static readonly tableValue = chalk.reset; // Default color for values
  static readonly tableId = chalk.dim; // Dimmed for IDs/secondary info

  // Status colors
  static readonly statusActive = chalk.green;
  static readonly statusDefault = chalk.cyan;
  static readonly statusMissing = chalk.yellow; // Yellow for missing/incomplete (warning)

  // Special formatting
  static readonly link = chalk.blue.underline;
  static readonly code = chalk.inverse;
  static readonly emphasis = chalk.bold;
}
