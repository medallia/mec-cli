// Surveys service specific constants
export const SURVEYS_ENDPOINTS = {
  SURVEY_LIST: '/admin/v0/surveys',
  SURVEY_BY_ID: (id: string) => `/admin/v0/surveys/${id}`,
  FLAT_VIEW: (id: string) => `/admin/v0/surveys/${id}/flat-view`,
} as const;

export const MEC_ADMIN_SURVEY_EDITOR_URL = (adminBaseUrl: string, id: string) =>
  `${adminBaseUrl}/admin/surveys/${id}/editor/draft`;

export const SURVEYS_CONFIG = {
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    DEFAULT_OFFSET: 0,
    MAX_LIMIT: 100,
  },
} as const;
