import ExcelJS from 'exceljs';
import FormData from 'form-data';

import { log } from '../../../utils';
import { ValidationError, NetworkError, CLIError } from '../../../utils/errors';
import { FileSystemAdapter, FileValidator, PathUtils } from '../../adapters/fs';
import { HttpClient } from '../../adapters/http';
import { API_DEFAULTS, EMOJIS, ERROR_CODES, FILE_EXTENSIONS } from '../../config';
import { Profile } from '../../config/types';
import { BaseService } from '../base';
import { SurveysService } from '../surveys';
import { SurveyFlatViewResponse, WhereUsedInfo, WhereUsedAccumulator } from '../surveys/types';

import { TRANSLATIONS_ENDPOINTS, TRANSLATIONS_STATUS, FILE_PROCESSING } from './constants';
import {
  DownloadTranslationsOptions,
  UploadTranslationsOptions,
  TranslationExportRequest,
  TranslationExportResponse,
  TranslationDownloadResult,
  TranslationUploadResult,
  TranslationImportItem,
  TranslationImportCommitResponse,
  TranslationImportChangesResponse,
} from './types';

export class TranslationsService extends BaseService {
  surveysService: SurveysService;
  private fsAdapter: FileSystemAdapter;

  constructor(profile: Profile, httpClient: HttpClient, surveysService: SurveysService) {
    super(profile, httpClient);
    this.surveysService = surveysService;
    this.fsAdapter = new FileSystemAdapter();
  }

  /**
   * Download translations for a survey
   */
  async downloadTranslations(
    options: DownloadTranslationsOptions
  ): Promise<TranslationDownloadResult> {
    const isDebugEnabled = options.saveDebugFiles;
    log.info(
      `${EMOJIS.LOADING} Downloading translations for survey(s): ${options.surveys.map(survey => `${survey.name} (${survey.id})`).join(', ')} ${isDebugEnabled ? '(Debug mode enabled)' : ''}`
    );

    for (const survey of options.surveys) {
      if (survey.translation_tag_id === null) {
        log.error(
          `${EMOJIS.ERROR} Cannot find translation tag ID for survey: ${survey.name} (${survey.id})`
        );
        throw new ValidationError(`No survey version found for: ${survey.name} (${survey.id})`);
      }
    }

    // Start export job
    const exportResponse = await this.httpClient.request<TranslationExportResponse>({
      method: 'POST',
      url: TRANSLATIONS_ENDPOINTS.EXPORTS,
      data: {
        type: 'translation-export',
        file_format: 'excel',
        translation_tag_ids: options.surveys.map(survey => ({
          id: `${survey.translation_tag_id}`,
        })),
        translation_locale_ids: [],
        translation_categories: [
          'questions',
          'answer_sets',
          'other_survey_content',
          'episode_fields',
          'formula_fields',
        ],
      } as TranslationExportRequest,
    });

    log.info(`${EMOJIS.PROGRESS} Export job started with ID: ${exportResponse.id}`);

    // Start parallel operations: export polling and flatview fetch
    const exportCompletionPromise = this.pollForStatus(
      () =>
        this.httpClient.request<{ status: string }>({
          method: 'GET',
          url: TRANSLATIONS_ENDPOINTS.EXPORT_BY_ID(exportResponse.id),
        }),
      'Export'
    );

    const flatViewPromises = options.surveys.map(survey =>
      this.surveysService.getSurveyFlatView(survey.id)
    );

    // Wait for both operations to complete
    const [, surveyFlatViewResponses] = await Promise.all([
      exportCompletionPromise,
      Promise.all(flatViewPromises),
    ]);

    // Generate file paths
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
    const isMultiSurvey = options.surveys.length > 1;
    const rawSurveyIdsPart = options.surveys.map(survey => survey.id).join('_');
    // Truncate survey IDs part if it's too long to avoid file system 255 character limit issues (considering additional suffixes and extensions)
    const truncatedSurveyIdsPart =
      rawSurveyIdsPart.length > 200 ? rawSurveyIdsPart.slice(0, 200) : rawSurveyIdsPart;
    const surveyIdsPart = isMultiSurvey
      ? `${truncatedSurveyIdsPart}-multi`
      : truncatedSurveyIdsPart;
    const simplifiedTranslationsFileName = `${surveyIdsPart}-${timestamp}${FILE_EXTENSIONS.EXCEL}`;
    const simplifiedTranslationsFilePath = PathUtils.join(
      options.outputPath,
      simplifiedTranslationsFileName
    );
    const rawTranslationsFileName = `${surveyIdsPart}-${timestamp}-${FILE_PROCESSING.RAW_TRANSLATIONS_SUFFIX}${FILE_EXTENSIONS.EXCEL}`;
    const rawTranslationsFilePath = isDebugEnabled
      ? PathUtils.join(options.outputPath, rawTranslationsFileName)
      : this.fsAdapter.getTempFilePath(rawTranslationsFileName);

    options.surveys.forEach((survey, index) => {
      const surveyFlatViewResponse = surveyFlatViewResponses[index];
      const surveyFlatViewFileName = `${survey.id}-${timestamp}-${FILE_PROCESSING.SURVEY_SPEC_SUFFIX}${FILE_EXTENSIONS.JSON}`;
      if (isDebugEnabled) {
        const surveyFlatViewFilePath = PathUtils.join(options.outputPath, surveyFlatViewFileName);
        this.fsAdapter.writeFileSync(
          surveyFlatViewFilePath,
          JSON.stringify(surveyFlatViewResponse, null, 2)
        );
        log.info(`${EMOJIS.FILE} Survey spec file saved to: ${surveyFlatViewFilePath}`);
      }
    });

    try {
      // Download file
      const fileResponse = await this.httpClient.request<ArrayBuffer>({
        method: 'GET',
        url: TRANSLATIONS_ENDPOINTS.EXPORT_FILE_HREF(exportResponse.id),
        responseType: 'arraybuffer',
      });

      this.fsAdapter.writeFileSync(rawTranslationsFilePath, Buffer.from(fileResponse));

      if (isDebugEnabled) {
        log.info(`${EMOJIS.FILE} Raw Excel file saved to: ${rawTranslationsFilePath}`);
      }

      // Process file
      const requestedLanguages = options.languages?.split(',').map(lang => lang.trim()) || [];
      const missingLanguages: string[] = [];
      await this.processDownloadedTranslationFile(
        rawTranslationsFilePath,
        simplifiedTranslationsFilePath,
        requestedLanguages,
        missingLanguages,
        options,
        surveyFlatViewResponses
      );

      this.cleanupTempFile(rawTranslationsFilePath, isDebugEnabled);

      log.info(
        `${EMOJIS.SUCCESS} Downloaded ${PathUtils.basename(simplifiedTranslationsFilePath)} translations for survey(s): ${options.surveys.map(s => s.name).join(', ')}`
      );

      return {
        processedFilePath: simplifiedTranslationsFilePath,
        rawTranslationsFilePath: isDebugEnabled ? rawTranslationsFilePath : '',
        missingLanguages,
      };
    } catch (error) {
      this.cleanupTempFile(rawTranslationsFilePath, isDebugEnabled);
      throw error;
    }
  }

  /**
   * Clean up temporary file if it shouldn't be saved
   */
  private cleanupTempFile(filePath: string, shouldSave?: boolean): void {
    if (!shouldSave && this.fsAdapter.existsSync(filePath)) {
      this.fsAdapter.deleteFileSync(filePath);
    }
  }

  /**
   * Process translation file - filter and simplify content
   */
  async processDownloadedTranslationFile(
    inputFilePath: string,
    outputFilePath: string,
    languages: string[],
    missingLanguages: string[],
    options: DownloadTranslationsOptions,
    surveyFlatViewResponses: SurveyFlatViewResponse[]
  ): Promise<string> {
    try {
      // Read input file
      const inputWorkbook = new ExcelJS.Workbook();
      await inputWorkbook.xlsx.readFile(inputFilePath);
      const inputWorksheet = inputWorkbook.worksheets[0];
      if (!inputWorksheet) {
        throw new ValidationError('No worksheet found in the Excel file');
      }

      // Extract header row
      const headerRow: string[] = [];
      const firstRow = inputWorksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        headerRow[colNumber - 1] = cell.value?.toString() ?? '';
      });
      if (headerRow.length === 0) {
        throw new ValidationError('No header row found in the worksheet');
      }

      // Find required columns
      const originalTextColumn = headerRow.find(col =>
        col?.toString().startsWith('Original text -')
      );
      const keyColIdx = headerRow.indexOf('Key');
      const contextColIndex = headerRow.indexOf('Context');
      const originalTextColIndex = originalTextColumn ? headerRow.indexOf(originalTextColumn) : -1;

      // Build column indices for output
      const columnIndices = ['Key'];
      if (originalTextColumn) {
        columnIndices.push(originalTextColumn);
      }

      // Add language columns
      if (languages.length > 0) {
        for (const language of languages) {
          const languageColumn = headerRow.find(
            col => col?.toString().toLowerCase() === language.toLowerCase()
          );
          if (languageColumn) {
            columnIndices.push(languageColumn);
          } else {
            missingLanguages.push(language);
          }
        }
      }

      const columnIndexNumbers = columnIndices
        .map(col => headerRow.indexOf(col))
        .filter(idx => idx !== -1);

      if (columnIndexNumbers.length === 0) {
        throw new ValidationError('Required columns (Key, Original text) not found');
      }

      // Build combined "Where Used" map across all surveys.
      // For each key: accumulate all non-unknown location strings (deduped via Set)
      // and resolve the effective type, where 'html' takes priority so that the
      // includeHtmlBlocks filter is applied correctly even across multiple surveys.
      const accumulator = new Map<string, WhereUsedAccumulator>();

      for (const [index, surveyFlatViewResponse] of surveyFlatViewResponses.entries()) {
        const surveyName = options.surveys[index].name;
        const whereUsedMap = this.surveysService.buildWhereUsedMap(
          surveyName,
          surveyFlatViewResponse
        );

        for (const [key, result] of whereUsedMap) {
          const existing = accumulator.get(key);
          if (!existing) {
            accumulator.set(key, {
              locations: new Set(result.location !== null ? [result.location] : []),
              type: result.type,
            });
          } else {
            if (result.type === 'html') {
              existing.type = 'html';
            } // html takes priority over other types
            if (result.location !== null) {
              existing.locations.add(result.location);
            }
          }
        }
      }

      const combinedWhereUsedMap = new Map<string, WhereUsedInfo>(
        [...accumulator.entries()].map(([key, value]) => [
          key,
          {
            location: value.locations.size > 0 ? [...value.locations].join(',\n') : null,
            type: value.type,
          },
        ])
      );

      // Filter rows
      const filteredRows: (string | number | undefined)[][] = [];
      inputWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        } // Skip header

        const rowValues: (string | number | undefined)[] = [];
        row.eachCell((cell, colNumber) => {
          rowValues[colNumber - 1] = cell.value as string | number | undefined;
        });

        const contextValue =
          contextColIndex !== -1
            ? (row
                .getCell(contextColIndex + 1)
                .value?.toString()
                .trim()
                .toLowerCase() ?? '')
            : '';
        const originalTextValue =
          originalTextColIndex !== -1
            ? (row.getCell(originalTextColIndex + 1).value?.toString() ?? '')
            : '';
        const keyValue = rowValues[keyColIdx]?.toString() ?? '';
        const whereUsedInfo = combinedWhereUsedMap.get(keyValue);

        // Skip blank rows
        if (originalTextValue.trim().toLowerCase() === '[blank]') {
          return;
        }

        // Filter logic
        if (contextColIndex !== -1 && rowValues[contextColIndex]) {
          const isInSurvey = contextValue === 'in survey';
          if (!isInSurvey) {
            return;
          }

          if (!options.includeHtmlBlocks) {
            const hasHtmlBlocks = whereUsedInfo?.type === 'html';
            if (hasHtmlBlocks) {
              return;
            }
          }
        }

        filteredRows.push(rowValues);
      });

      // Prepare output headers with extra columns
      const outputHeaders = [...columnIndexNumbers];
      outputHeaders.splice(1, 0, -1, -2); // Add Where Used and Notes to Translator after Key
      const headerRowWithExtraColumns = outputHeaders.map(idx => {
        if (idx === -1) {
          return 'Where Used (applies to selected surveys only)';
        }
        if (idx === -2) {
          return 'Notes to Translator';
        }
        return headerRow[idx];
      });

      // Create output workbook
      const outputWorkbook = new ExcelJS.Workbook();
      const outputWorksheet = outputWorkbook.addWorksheet(FILE_PROCESSING.EXCEL_SHEET_NAME);

      // Add styled header
      const headerRowObj = outputWorksheet.addRow(headerRowWithExtraColumns);
      headerRowObj.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4050C6' },
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' },
          bold: true,
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };
      });

      // Set column widths
      headerRowWithExtraColumns.forEach((headerText, index) => {
        const column = outputWorksheet.getColumn(index + 1);
        const headerLength = headerText?.toString().length || 10;
        column.width = Math.max(headerLength + 2, 12);
      });

      // Set wider width for "Where Used" column to accommodate multi-line content
      const whereUsedColIndex = outputHeaders.indexOf(-1) + 1;
      if (whereUsedColIndex > 0) {
        outputWorksheet.getColumn(whereUsedColIndex).width = 50;
      }

      // Add data rows
      filteredRows.forEach(rowValues => {
        const keyValue = rowValues[keyColIdx]?.toString() ?? '';
        const originalTextValue = rowValues[originalTextColIndex]?.toString() ?? '';

        const whereUsedInfo = combinedWhereUsedMap.get(keyValue);
        const whereUsedValue = whereUsedInfo?.location || '';
        const notesToTranslator = this.generateNotesToTranslator(originalTextValue);

        const outputRow = outputHeaders.map(idx => {
          if (idx === -1) {
            return whereUsedValue;
          }
          if (idx === -2) {
            return notesToTranslator;
          }
          return rowValues[idx] ?? '';
        });
        const row = outputWorksheet.addRow(outputRow);

        // Enable text wrapping for the "Where Used" cell to show line breaks
        if (whereUsedColIndex > 0 && whereUsedValue.includes('\n')) {
          row.getCell(whereUsedColIndex).alignment = { wrapText: true, vertical: 'middle' };
        }
      });

      await outputWorkbook.xlsx.writeFile(outputFilePath);
      return outputFilePath;
    } catch (e) {
      log.error(`${EMOJIS.ERROR} Error processing file: ${String(e)}`);
      throw e;
    }
  }

  /**
   * Generate notes to translator based on text content
   */
  private generateNotesToTranslator(text: string): string {
    if (!text) {
      return '';
    }

    const hasHtmlBlocks = TranslationsService.containsHtmlBlocks(text);
    const hasVariables = TranslationsService.containsVariables(text);

    if (hasHtmlBlocks && hasVariables) {
      return 'Contains HTML/code and variables - please be mindful of the structure when performing the translation';
    } else if (hasHtmlBlocks) {
      return 'Contains HTML/code - please be mindful of the structure when performing the translation';
    } else if (hasVariables) {
      return 'Contains variable text - please be mindful of the structure when performing the translation';
    }

    return '';
  }

  /**
   * Check if text contains HTML blocks using regex
   */
  static containsHtmlBlocks(text: string): boolean {
    // Simple HTML tag regex - looks for opening and closing tags
    const htmlTagRegex = /^<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(?:\/>|>[\s\S]*<\/\1>)$/;

    // Pseudo-HTML style pattern regex
    // Matches: [b], [/b], [u], [/u], [a href="..."], [/a], etc.
    const pseudoHtmlRegex = /\[(\/)?[a-z]+(?:\s+[a-z]+="[^"]*")?\]/gi;

    return htmlTagRegex.test(text) || pseudoHtmlRegex.test(text);
  }

  /**
   * Check if text contains variables using regex
   */
  static containsVariables(text: string): boolean {
    // Matches variable patterns like [=variable_name], [=e_firstname:html], [=e_firstname:John:html], etc.
    const variableRegex = /\[=[^\s\]]+[^\]]*\]/g;

    return variableRegex.test(text);
  }

  /**
   * Upload translations for a survey
   */
  async uploadTranslations(
    options: UploadTranslationsOptions
  ): Promise<TranslationUploadResult | TranslationImportChangesResponse> {
    const inputFile = options.file;
    const isDebugEnabled = options.saveDebugFiles;
    log.info(
      `${EMOJIS.LOADING} Starting upload of translations file: ${inputFile} ${isDebugEnabled ? '(Debug mode enabled)' : ''} `
    );

    // Validate file exists
    if (!this.fsAdapter.existsSync(inputFile)) {
      throw new ValidationError(`Translation file not found: ${inputFile}`);
    }

    // Process file for upload
    const processedFilePath = await this.processFileForUpload(
      inputFile,
      options.outputPath,
      isDebugEnabled
    );

    try {
      // Create import job
      const importId = await this.createImportJob(processedFilePath);

      // Wait for import to be processed
      await this.pollForStatus(
        () =>
          this.httpClient.request<TranslationImportItem>({
            method: 'GET',
            url: TRANSLATIONS_ENDPOINTS.IMPORT_BY_ID(importId),
          }),
        'Import'
      );

      // Handle dry run or commit
      if (options.pretendUpload) {
        const changes = await this.httpClient.request<TranslationImportChangesResponse>({
          method: 'GET',
          url: TRANSLATIONS_ENDPOINTS.IMPORT_CHANGES(importId),
        });
        this.normalizeAndDeduplicateChanges(changes);
        this.cleanupTempFile(processedFilePath, isDebugEnabled);
        return changes;
      }

      // Commit import
      await this.commitImport(importId);
      this.cleanupTempFile(processedFilePath, isDebugEnabled);

      log.info(`${EMOJIS.SUCCESS} Translation upload completed successfully!`);
      return { success: true, translationsFilePath: options.file };
    } catch (error) {
      this.cleanupTempFile(processedFilePath, isDebugEnabled);
      throw error;
    }
  }

  /**
   * Normalizes and deduplicates a changes response in-place.
   *
   * When a user edits a translation item once in the Excel file, the upload
   * process programmatically applies that edit to multiple context rows:
   *   - "In survey"        → maps to the survey-only.surv    context
   *   - "In mobile survey" → maps to the survey-only.survMobile context
   *
   * This means the API returns one change entry per context variant, so a
   * single user edit can appear 2+ times in the changes list. To avoid
   * showing the same logical change multiple times, we deduplicate by the
   * combination of (translation_item key, locale_id) — which uniquely
   * identifies one translation string for one language, regardless of context.
   */
  private normalizeAndDeduplicateChanges(changes: TranslationImportChangesResponse): void {
    const seen = new Set<string>();
    const uniqueItems: TranslationImportChangesResponse['items'] = [];

    for (const item of changes.items) {
      // Resolve the locale UUID from the linked locale resource URL
      const localeHref = item._links?.translation_locale?.href ?? '';
      item.locale_id = localeHref.split('/').pop() || 'unknown';

      // Deduplicate: one entry per (translation item key × locale)
      const translationItemHref = item._links?.translation_item?.href ?? item.id;
      const dedupeKey = `${translationItemHref}|${item.locale_id}`;

      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        uniqueItems.push(item);
      }
    }

    changes.items = uniqueItems;
    changes._total = uniqueItems.length;
  }

  /**
   * Process file for upload - adds Context column and duplicates rows
   */
  private async processFileForUpload(
    filePath: string,
    outputPath: string,
    isDebugEnabled: boolean
  ): Promise<string> {
    try {
      // Read input file
      const inputWorkbook = new ExcelJS.Workbook();
      await inputWorkbook.xlsx.readFile(filePath);
      const inputWorksheet = inputWorkbook.worksheets[0];

      if (!inputWorksheet) {
        throw new ValidationError('No worksheet found in the Excel file');
      }

      // Extract all rows
      const allRows: ExcelJS.CellValue[][] = [];
      inputWorksheet.eachRow(row => {
        const rowValues: ExcelJS.CellValue[] = [];
        row.eachCell((cell, colNumber) => {
          rowValues[colNumber - 1] = cell.value;
        });
        allRows.push(rowValues);
      });

      if (allRows.length === 0) {
        throw new ValidationError('No data found in the worksheet');
      }

      // Prepare header with Context column
      const headerRow = [...allRows[0]];
      let contextColIndex = headerRow.indexOf('Context');
      if (contextColIndex === -1) {
        headerRow.push('Context');
        contextColIndex = headerRow.length - 1;
      }

      // Create output workbook
      const outputWorkbook = new ExcelJS.Workbook();
      const outputWorksheet = outputWorkbook.addWorksheet(FILE_PROCESSING.EXCEL_SHEET_NAME);

      outputWorksheet.addRow(headerRow);

      // Process and duplicate data rows
      for (const originalRow of allRows.slice(1)) {
        // Ensure row has enough columns
        while (originalRow.length <= contextColIndex) {
          originalRow.push('');
        }

        // Add three variations with different context values
        const contexts = ['In Survey', 'In survey', 'In mobile survey'];
        contexts.forEach(context => {
          const row = [...originalRow];
          row[contextColIndex] = context;
          outputWorksheet.addRow(row);
        });
      }

      // Generate output file path
      const originalFileName = FileValidator.sanitizeFilename(
        PathUtils.basename(filePath) || 'translations.xlsx'
      );
      const originalFileNameWithoutExtension =
        PathUtils.getFileNameWithoutExtension(originalFileName);
      const processedFileName = `${originalFileNameWithoutExtension}-${FILE_PROCESSING.PROCESSED_TRANSLATIONS_SUFFIX}.xlsx`;

      const outputFilePath = isDebugEnabled
        ? PathUtils.join(outputPath, processedFileName)
        : this.fsAdapter.getTempFilePath(processedFileName);

      if (isDebugEnabled) {
        log.info(`${EMOJIS.FILE} Processed file will be saved to: ${outputFilePath}`);
      }

      await outputWorkbook.xlsx.writeFile(outputFilePath);
      return outputFilePath;
    } catch (e) {
      if (e instanceof Error && (e as NodeJS.ErrnoException).code === 'ENAMETOOLONG') {
        throw new ValidationError('The file name is too long. Try using a shorter file name.');
      }
      log.error(`${EMOJIS.ERROR} Error processing file for upload: ${String(e)}`);
      throw e;
    }
  }

  /**
   * Create import job
   */
  private async createImportJob(filePath: string): Promise<string> {
    log.info(`${EMOJIS.PROGRESS} Uploading file to translation imports...`);

    const formData = new FormData();
    const fileName = FileValidator.sanitizeFilename(
      PathUtils.basename(filePath) || 'translations.xlsx'
    );
    formData.append('file', this.fsAdapter.createReadStream(filePath), fileName);

    const importItem = await this.httpClient.request<TranslationImportItem>({
      method: 'POST',
      url: TRANSLATIONS_ENDPOINTS.IMPORTS,
      data: formData,
      headers: { ...formData.getHeaders() },
    });

    if (!importItem?.id) {
      throw new NetworkError('No import job created');
    }

    log.info(`${EMOJIS.PROGRESS} Upload started with import ID: ${importItem.id}`);
    return importItem.id;
  }

  /**
   * Commit import and wait for completion
   */
  private async commitImport(importId: string): Promise<void> {
    log.info(`${EMOJIS.PROGRESS} Committing translation import...`);

    try {
      await this.httpClient.request<TranslationImportCommitResponse>({
        method: 'PUT',
        url: TRANSLATIONS_ENDPOINTS.IMPORT_COMMIT(importId),
        data: { type: 'translation-import-commit' },
      });
    } catch (error) {
      log.error(`${EMOJIS.ERROR} Failed to commit import: ${JSON.stringify(error)}`);
      throw new NetworkError(`Failed to commit import: ${String(error)}`);
    }

    // Wait for commit to complete
    let attempts = 0;
    const maxAttempts = API_DEFAULTS.POLL_MAX_ATTEMPTS;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, API_DEFAULTS.POLL_INTERVAL_MS));

      log.info(
        `${EMOJIS.LOADING} Checking commit status... (Attempt ${attempts + 1}/${maxAttempts})`
      );

      const commitStatus = await this.httpClient.request<TranslationImportCommitResponse>({
        method: 'GET',
        url: TRANSLATIONS_ENDPOINTS.IMPORT_COMMIT(importId),
      });

      if (commitStatus.error_type) {
        throw new NetworkError(`Commit failed: ${commitStatus.message || 'unknown error'}`);
      }

      if (!commitStatus.error_type && !commitStatus.error_message) {
        break;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new CLIError('Commit timed out after maximum attempts', 'TIMEOUT_ERROR', 10);
      }
    }
  }

  /**
   * Generic polling helper for status checks
   */
  private async pollForStatus<T extends { status?: string; error_message?: string | null }>(
    statusCheck: () => Promise<T>,
    operationType: string
  ): Promise<T> {
    let attempts = 0;

    while (attempts < API_DEFAULTS.POLL_MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, API_DEFAULTS.POLL_INTERVAL_MS));
      log.info(
        `${EMOJIS.LOADING} Checking ${operationType.toLowerCase()} status... (Attempt ${attempts + 1}/${API_DEFAULTS.POLL_MAX_ATTEMPTS})`
      );

      const status = await statusCheck();

      if (status.status === TRANSLATIONS_STATUS.ERROR) {
        log.error(
          `${EMOJIS.ERROR} ${operationType} job failed: ${status.error_message || 'unknown error'}`
        );
        throw new NetworkError(
          `${operationType} job failed: ${status.error_message || 'unknown error'}`
        );
      }

      if (status.status === TRANSLATIONS_STATUS.READY) {
        log.info(`${EMOJIS.PROGRESS} ${operationType} completed successfully`);
        return status;
      }

      log.info(`${EMOJIS.PROGRESS} ${operationType} status: ${status.status}`);
      attempts++;
    }

    throw new CLIError(
      `${operationType} job timed out after maximum attempts`,
      'TIMEOUT_ERROR',
      ERROR_CODES.TIMEOUT_ERROR
    );
  }
}
