// types/index.ts - 타입 익스포트 집합

// Survey 관련 타입
export type {
  Language,
  Creator,
  OffTime,
  Schedule,
  AnalyticsSettings,
  SurveySettings,
  Section,
  Survey,
} from './survey';

export { DEFAULT_SURVEY } from './survey';

// Question 관련 타입
export type {
  QuestionType,
  PromptType,
  DisplayType,
  Importance,
  QuestionOption,
  AudioMetadata,
  SelectionValidation,
  TextValidation,
  AudioValidation,
  ValidationRule,
  LegacyValidation,
  Question,
} from './question';

export {
  QUESTION_TEMPLATES,
  QUESTION_TYPE_LABELS,
  IMPORTANCE_LABELS,
} from './question';

// Graph 관련 타입
export type {
  QuestionNodeData,
  StartNodeData,
  EndNodeData,
  SectionNodeData,
  QuestionNode,
  StartNode,
  EndNode,
  SectionNode,
  SurveyNode,
  EdgeData,
  SurveyEdge,
  GraphState,
  GraphError,
  ValidationResult,
} from './graph';

export {
  createQuestionNode,
  createStartNode,
  createEndNode,
  createEdge,
} from './graph';
