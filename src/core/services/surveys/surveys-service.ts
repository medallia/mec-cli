import axios from 'axios';

import { log } from '../../../utils';
import { ValidationError } from '../../../utils/errors';
import { HttpClient } from '../../adapters/http';
import { API_DEFAULTS, EMOJIS } from '../../config';
import { Profile } from '../../config/types';
import { BaseService } from '../base';

import { SURVEYS_ENDPOINTS } from './constants';
import {
  SurveyFlatViewResponse,
  SurveyItem,
  SurveyListResponse,
  WhereUsedInfo,
  SurveyModelItem,
  QuestionField,
  AlternativeSet,
  AlternativeItem,
} from './types';

export class SurveysService extends BaseService {
  constructor(profile: Profile, httpClient: HttpClient) {
    super(profile, httpClient);
  }

  /**
   * List all surveys with optional search by name (paginated)
   */
  async listSurveys(options?: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<SurveyListResponse> {
    log.info(`${EMOJIS.LOADING} Listing surveys...`);

    const params = new URLSearchParams();

    if (options?.q) {
      params.append('q', options.q);
    }
    params.append('limit', options?.limit?.toString() ?? API_DEFAULTS.PAGINATION.LIMIT.toString());
    params.append(
      'offset',
      options?.offset?.toString() ?? API_DEFAULTS.PAGINATION.OFFSET.toString()
    );

    const queryString = params.toString();
    const url = queryString
      ? `${SURVEYS_ENDPOINTS.SURVEY_LIST}?${queryString}`
      : SURVEYS_ENDPOINTS.SURVEY_LIST;

    const response = await this.httpClient.request<SurveyListResponse>({
      method: 'GET',
      url,
    });

    log.info(
      `${EMOJIS.SUCCESS} Listed ${response.items.length} surveys (${response._total} total)`
    );

    return response;
  }

  /**
   * Get all surveys (handles pagination automatically)
   */
  async getAllSurveys(options?: { q?: string }): Promise<SurveyItem[]> {
    log.info(`${EMOJIS.LOADING} Getting all surveys...`);

    const allSurveys: SurveyItem[] = [];
    let offset = 0;
    const limit = API_DEFAULTS.PAGINATION.MAX_LIMIT;
    let hasMore = true;

    while (hasMore) {
      log.info(`${EMOJIS.LOADING} Fetching surveys (offset: ${offset}, limit: ${limit})...`);
      const response = await this.listSurveys({ q: options?.q, offset, limit });

      allSurveys.push(...response.items);

      hasMore = response.items.length === limit && allSurveys.length < response._total;
      offset += limit;
    }

    log.info(`${EMOJIS.SUCCESS} Retrieved all ${allSurveys.length} surveys`);

    return allSurveys;
  }

  /**
   * Get surveys by name (returns list of matching surveys)
   */
  async getSurveyByName(surveyName: string): Promise<SurveyItem[]> {
    log.info(`${EMOJIS.LOADING} Getting surveys by name: "${surveyName}"...`);

    const allSurveys = await this.getAllSurveys({ q: surveyName });

    if (allSurveys.length === 0) {
      throw new ValidationError(`No survey program found with name: "${surveyName}"`);
    }

    return allSurveys;
  }

  /**
   * Get survey by UUID
   */
  async getSurveyByUuid(surveyUuid: string): Promise<SurveyItem> {
    log.info(`${EMOJIS.LOADING} Fetching survey by UUID: ${surveyUuid}...`);

    try {
      const response = await this.httpClient.request<SurveyItem>({
        method: 'GET',
        url: SURVEYS_ENDPOINTS.SURVEY_BY_ID(surveyUuid),
      });

      log.info(`${EMOJIS.SUCCESS} Retrieved survey "${response.name}" for UUID "${surveyUuid}"`);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new ValidationError(`No survey program found with UUID: "${surveyUuid}"`);
      }
      throw error;
    }
  }

  /**
   * Get flat view of survey (for building where-used map)
   */
  async getSurveyFlatView(surveyUuid: string): Promise<SurveyFlatViewResponse> {
    log.info(`${EMOJIS.LOADING} Fetching flat view for survey UUID: ${surveyUuid}...`);

    const response = await this.httpClient.request<SurveyFlatViewResponse>({
      method: 'GET',
      url: SURVEYS_ENDPOINTS.FLAT_VIEW(surveyUuid),
    });

    log.info(`${EMOJIS.SUCCESS} Retrieved flat view for survey UUID: ${surveyUuid}`);
    return response;
  }

  buildWhereUsedMap(surveyName: string, surveyFlatViewResponse: SurveyFlatViewResponse): Map<string, WhereUsedInfo> {
    const whereUsedMap = new Map<string, WhereUsedInfo>();

    // O(1) lookup maps — built once, used by all resolve functions
    const surveyModelMap = new Map<string, SurveyModelItem>();
    const surveyModelByFieldId = new Map<string, SurveyModelItem>();
    const surveyModelByTranslationKey = new Map<string, SurveyModelItem>();
    surveyFlatViewResponse.survey_model.forEach(item => {
      if (item.id) surveyModelMap.set(item.id, item);
      if (item.field?.id) surveyModelByFieldId.set(item.field.id, item);
      item.translation_keys?.forEach(tk => {
        if (tk['translation-key']) surveyModelByTranslationKey.set(tk['translation-key'], item);
      });
    });

    const questionFieldByTranslationKey = new Map<string, QuestionField>();
    const questionFieldByAltSetId = new Map<string, QuestionField>();
    surveyFlatViewResponse.question_fields.forEach(qf => {
      if (qf.translation_key) questionFieldByTranslationKey.set(qf.translation_key, qf);
      if (qf.alternative_set?.id) questionFieldByAltSetId.set(qf.alternative_set.id, qf);
    });

    const alternativeByTranslationKey = new Map<string, { alt: AlternativeItem; altSet: AlternativeSet }>();
    surveyFlatViewResponse.alternative_sets.forEach(altSet => {
      altSet.alternatives?.forEach(alt => {
        if (alt.translation_key) alternativeByTranslationKey.set(alt.translation_key, { alt, altSet });
      });
    });

    const resolve = (key: string): WhereUsedInfo => {
      if (key.startsWith(':question:')) {
        return resolveQuestionKey(key);
      }
      if (key.startsWith(':alternative:')) {
        return resolveAlternativeKey(key);
      }
      if (key.startsWith(':survey_program:')) {
        return resolveSurveyProgramKey(key);
      }
      return { location: 'Unknown Location', type: 'unknown' };
    };

    // 1. :question: resolution
    const resolveQuestionKey = (key: string): WhereUsedInfo => {
      const questionField = questionFieldByTranslationKey.get(key);
      if (!questionField?.key) {
        return { location: 'Unknown Question Location', type: 'question' };
      }

      const surveyModelElement = surveyModelByFieldId.get(questionField.key);
      if (!surveyModelElement) {
        return { location: 'Unknown Question Location', type: 'question' };
      }

      // Use survey_model[].position for Question numbering (position+1)
      const questionNumber = (surveyModelElement.position ?? 0) + 1;

      // Walk container.id chain upward to build full path including grids and sections
      const containerPath = buildContainerPath(surveyModelElement.container?.id);

      return {
        location: `${surveyName} > ${containerPath} > Question ${String(questionNumber).padStart(2, '0')}`,
        type: 'question',
      };
    };

    // 2. :alternative: resolution
    const resolveAlternativeKey = (key: string): WhereUsedInfo => {
      const altEntry = alternativeByTranslationKey.get(key);
      if (!altEntry) {
        return { location: 'Unknown Answer Location', type: 'alternative' };
      }

      const { alt: foundAlternative, altSet: foundAlternativeSet } = altEntry;
      const answerNumber = (foundAlternative.sequence_number ?? 0) + 1;

      const questionField = questionFieldByAltSetId.get(foundAlternativeSet.id);
      if (!questionField?.key) {
        return { location: `Answer ${String(answerNumber).padStart(2, '0')}`, type: 'alternative' };
      }

      const surveyModelElement = surveyModelByFieldId.get(questionField.key);
      if (!surveyModelElement) {
        return { location: `Answer ${String(answerNumber).padStart(2, '0')}`, type: 'alternative' };
      }

      const questionNumber = (surveyModelElement.position ?? 0) + 1;

      // Walk container.id chain upward to build full path
      const containerPath = buildContainerPath(surveyModelElement.container?.id);

      return {
        location: `${surveyName} > ${containerPath} > Question ${String(questionNumber).padStart(2, '0')} > Answer ${String(answerNumber).padStart(2, '0')}`,
        type: 'alternative',
      };
    };

    // 3. :survey_program: resolution
    const resolveSurveyProgramKey = (key: string): WhereUsedInfo => {
      const foundElement = surveyModelByTranslationKey.get(key);
      if (!foundElement) {
        return { location: 'Unknown Survey Program Location', type: 'unknown' };
      }

      // Check type and determine element type
      const elementType = getElementTypeName(foundElement.type);
      const elementNumber = (foundElement.position ?? 0) + 1;

      // Walk up containers to build full path
      const containerPath = buildContainerPath(foundElement.container?.id);

      return {
        location: `${surveyName} > ${containerPath} > ${elementType} ${String(elementNumber).padStart(2, '0')}`,
        type: foundElement.type,
      };
    };

    // Helper to get element type name
    const getElementTypeName = (type: string | undefined): string => {
      switch (type?.toLowerCase()) {
        case 'text':
          return 'Text Block';
        case 'html':
          return 'HTML Block';
        case 'image':
          return 'Image Tool Tip';
        case 'grid':
          return 'Grid';
        default:
          return 'Content';
      }
    };

    // Helper to build container path with improved logic
    const buildContainerPath = (containerId: string | undefined): string => {
      if (!containerId) {
        return 'Unknown Page';
      }

      const path: string[] = [];
      let currentContainer: SurveyModelItem | undefined = surveyModelMap.get(containerId);

      while (currentContainer) {
        const pathElement = buildPathElement(currentContainer);
        if (pathElement.isRootPage) {
          path.unshift(pathElement.name);
          break;
        } else {
          path.unshift(pathElement.name);
        }

        // Move up the container chain
        const parentId = currentContainer.container?.id;
        currentContainer = parentId ? surveyModelMap.get(parentId) : undefined;
      }

      return path.length > 0 ? path.join(' > ') : 'Unknown Page';
    };

    // Helper to build individual path elements
    const buildPathElement = (
      container: SurveyModelItem
    ): { name: string; isRootPage: boolean } => {
      const position = (container.position ?? 0) + 1;

      // Root level page is identified when type == "section" AND container.id == "model"
      if (
        container.type?.toLowerCase() === 'section' &&
        container.container?.id?.toLowerCase() === 'model'
      ) {
        let pageName = `Page ${String(position).padStart(2, '0')}`;

        // Add meaningful name if available
        if (
          container.name?.trim() &&
          container.name.toLowerCase() !== 'page' &&
          container.name.toLowerCase() !== 'new page'
        ) {
          pageName = `${pageName} - ${container.name}`;
        }

        return { name: pageName, isRootPage: true };
      }

      // Handle other container types
      switch (container.type?.toLowerCase()) {
        case 'section':
          // Nested section
          return {
            name: container.name || `Section ${String(position).padStart(2, '0')}`,
            isRootPage: false,
          };
        case 'end-section': {
          // End section
          let endSectionName = `Page ${String(position).padStart(2, '0')}`;
          if (
            container.name?.trim() &&
            container.name !== 'Page' &&
            container.name !== 'New Page'
          ) {
            endSectionName = `${endSectionName} - ${container.name}`;
          }
          return { name: endSectionName, isRootPage: false };
        }
        default: {
          // Other containers (Grid, etc.)
          const containerType = container.type.charAt(0).toUpperCase() + container.type.slice(1);
          return {
            name: `${containerType} ${String(position).padStart(2, '0')}`,
            isRootPage: false,
          };
        }
      }
    };

    // Pre-build the map by processing all possible translation keys upfront
    // Collect all keys from question fields
    surveyFlatViewResponse.question_fields.forEach(qf => {
      if (qf.translation_key && !whereUsedMap.has(qf.translation_key)) {
        whereUsedMap.set(qf.translation_key, resolve(qf.translation_key));
      }
    });

    // Collect keys from alternative sets
    surveyFlatViewResponse.alternative_sets.forEach(altSet => {
      if (altSet.alternatives) {
        altSet.alternatives.forEach(alt => {
          if (alt.translation_key && !whereUsedMap.has(alt.translation_key)) {
            whereUsedMap.set(alt.translation_key, resolve(alt.translation_key));
          }
        });
      }
    });

    // Collect keys from survey model translation keys
    surveyFlatViewResponse.survey_model.forEach(sm => {
      if (sm.translation_keys) {
        sm.translation_keys.forEach(tk => {
          if (tk['translation-key'] && !whereUsedMap.has(tk['translation-key'])) {
            whereUsedMap.set(tk['translation-key'], resolve(tk['translation-key']));
          }
        });
      }
    });

    return whereUsedMap;
  }
}
