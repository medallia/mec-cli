export interface SurveyListResponse {
  _links: SurveyLinks;
  items: SurveyItem[];
  _total: number;
  _allowed: string[];
}

export interface SurveyLinks {
  self: Link;
  canonical: Link;
  prev: Link | null;
  next: Link | null;
}

export interface SurveyItem {
  id: string;
  translation_tag_id: string | null;
  name: string;
  _links: SurveyItemLinks;
  _allowed: string[];
}

export interface SurveyItemLinks {
  flat_view: Link;
  self: Link;
  canonical: Link;
}

export interface Link {
  href: string;
  rel: string;
}

// Survey Flat View
export interface SurveyFlatViewResponse {
  survey_model: SurveyModelItem[];
  question_fields: QuestionField[];
  composite_fields: unknown[];
  episode_fields: unknown[];
  unit_fields: unknown[];
  unit_group_fields: unknown[];
  alternative_sets: AlternativeSet[];
}

export interface SurveyModelItem {
  type: string;
  id: string;
  position?: number;
  name?: string;
  description?: string;
  precondition_script?: string;
  container?: { id: string };
  caption?: string | null;
  field?: { id: string };
  tooltips?: unknown[];
  html?: string;
  info_text?: string;
  component_data?: unknown;
  instructions?: string;
  disclaimer?: string;
  additional_text?: string;
  translation_keys?: Array<{ 'translation-key': string }>;
}

export interface QuestionField {
  field_type: string;
  id: string;
  uuid: string;
  key: string;
  name: string;
  data_type: string;
  string_format?: string | null;
  translation_key?: string;
  short_name?: string;
  abbreviation?: string;
  in_survey?: string;
  in_mobile_survey?: string;
  user_text?: string;
  priority?: number;
  description?: string | null;
  category?: string | null;
  export_label?: string | null;
  translation_explanation?: string;
  alternative_set?: { id: string };
}

export interface AlternativeItem {
  id: string;
  in_survey?: string;
  in_mobile_survey?: string;
  short_form?: string;
  description?: string;
  sequence_number?: number;
  numeric_value?: number | null;
  export_value?: string | null;
  priority_raw?: number;
  translation_key?: string;
}

export interface AlternativeSet {
  id: string;
  name: string;
  form_kind: string;
  content_kind: string;
  alternatives: AlternativeItem[];
}

export interface WhereUsedInfo {
  location: string | null; // null = could not be resolved for this survey
  // Available types for survey_program:
  // section, cookie-confirmation, trip-advisor, trip-advisor-external-widget,
  // end-section, text, image, grid, date-picker, media-question, file-upload-question,
  // matrix-question, multilevel-selector, selector, hidden-input, hidden-validation, ask-now,
  // multifield-selector, multivalue-selector, spacer, html, question, one-time-auth-code,
  // bazaarvoice, incorrect-recipient-notice, remote-api-call, ranking-question
  type: string;
}

export interface WhereUsedMap {
  get(key: string): WhereUsedInfo;
  has(key: string): boolean;
  forEach(fn: (value: WhereUsedInfo, key: string) => void): void;
}

export interface WhereUsedAccumulator {
  locations: Set<string>;
  type: string;
}
