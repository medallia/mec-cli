import { SurveyItem } from '../surveys';

export interface DownloadTranslationsOptions {
  surveys: SurveyItem[];
  outputPath: string;
  saveDebugFiles: boolean;
  languages: string;
  includeHtmlBlocks: boolean;
}

export interface UploadTranslationsOptions {
  file: string;
  outputPath: string;
  saveDebugFiles: boolean;
  pretendUpload: boolean;
}

export interface TranslationExportRequest {
  type: string;
  file_format: 'excel' | 'csv';
  translation_tag_ids: TranslationTag[];
  translation_locale_ids: TranslationLocale[];
  translation_context_ids?: TranslationContext[];
  translation_categories?: string[];
}

export interface TranslationTag {
  id: string;
}

export interface TranslationLocale {
  id: string;
}

export interface TranslationContext {
  id: string;
}

export interface TranslationDownloadResult {
  processedFilePath: string;
  rawTranslationsFilePath?: string;
  missingLanguages: string[];
}

export interface TranslationExportResponse {
  type: string;
  id: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  _allowed: string[];
  translation_tag_ids: TranslationTagWithAllowed[];
  translation_categories: string[];
  full_translation_categories: string[] | null;
  translation_locale_ids: string[] | null;
  translation_context_ids: TranslationContextWithAllowed[];
  not_translation_context_ids: string[] | null;
  translation_statuses: string[] | null;
  file_format: string;
  translation_entity_type: string | null;
  translation_entity_uuid: string | null;
  translations_view_id: string | null;
  _links: TranslationExportLinks;
}

export interface TranslationTagWithAllowed {
  id: string;
  _allowed: string[];
}

export interface TranslationContextWithAllowed {
  id: string;
  _allowed: string[];
}

export interface TranslationExportLinks {
  file: Link | null;
  self: Link;
  canonical: Link;
  collection: Link;
}

export interface Link {
  href: string;
  rel: string;
}

// Translations Import
export interface TranslationImportResponse {
  items: TranslationImportItem[];
  _total: number;
  _allowed: string[];
}

export interface TranslationImportItem {
  id: string;
  file_name: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  _allowed: string[];
  _links: TranslationImportLinks;
}

export interface TranslationImportLinks {
  self: Link;
  canonical: Link;
  collection: Link;
}

export interface TranslationUploadResult {
  success: boolean;
  translationsFilePath?: string;
}

export interface TranslationImportChangesResponse {
  items: TranslationImportChangesItem[];
  _total: number;
  _allowed: string[];
}

export interface TranslationImportChangesItem {
  id: string;
  new_text: string;
  old_text: string;
  translation_issues: TranslationIssueItem[];
  translation_category: string;
  type: string;
  error_code?: string;
  error_message?: string;
}

export interface TranslationIssueItem {
  code: string;
  message: string;
  severity: string;
  _allowed: string[];
}

export interface TranslationImportCommitResponse {
  type: string;
  error_type?: string;
  error_message?: string;
  message?: string;
}
