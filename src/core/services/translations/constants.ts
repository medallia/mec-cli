// Translations service specific constants
export const TRANSLATIONS_ENDPOINTS = {
  EXPORTS: '/admin/v0/translation-exports',
  EXPORT_BY_ID: (id: string) => `/admin/v0/translation-exports/${id}`,
  EXPORT_FILE_HREF: (id: string) => `/admin/v0/translation-exports/${id}/file`, // Not used for now.
  IMPORTS: '/admin/v0/translation-imports',
  IMPORT_BY_ID: (id: string) => `/admin/v0/translation-imports/${id}`,
  IMPORT_CHANGES: (id: string) => `/admin/v0/translation-imports/${id}/changes`,
  IMPORT_COMMIT: (id: string) => `/admin/v0/translation-imports/${id}/commit`,
} as const;

export const FILE_PROCESSING = {
  EXCEL_SHEET_NAME: 'Translations (v1.2)',
  RAW_TRANSLATIONS_SUFFIX: 'raw-translations',
  PROCESSED_TRANSLATIONS_SUFFIX: 'processed-translations',
  SURVEY_SPEC_SUFFIX: 'survey-spec',
} as const;

// Translations Export / Import status constants
export const TRANSLATIONS_STATUS = {
  PENDING: 'pending',
  READY: 'ready',
  ERROR: 'error',
} as const;
