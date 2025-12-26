// types/question.ts - 질문 관련 타입 정의

export type QuestionType = 'multiple_choice' | 'text_opinion' | 'voice_opinion';

export type PromptType = 'text_prompt' | 'voice_prompt';

export type DisplayType = 'default' | 'likert_scale';

export type Importance = 'low' | 'medium' | 'high' | 'critical';

export interface QuestionOption {
  value: string;
  label: string;
  score: number;
  category?: string;
}

export interface AudioMetadata {
  format: 'mp3' | 'wav';
  duration?: number;
  maxRecordingTime?: number;
  hasTranscript: boolean;
  transcript?: string;
}

// 선택 검증 규칙
export interface SelectionValidation {
  type: 'selection';
  minSelections: number;
  maxSelections: number;
}

// 텍스트 검증 규칙
export interface TextValidation {
  type: 'text';
  minLength: number;
  maxLength: number;
  pattern: string | null;
}

// 오디오 검증 규칙
export interface AudioValidation {
  type: 'audio';
  minDuration: number;
  maxDuration: number;
}

export type ValidationRule = SelectionValidation | TextValidation | AudioValidation;

// 기본 검증 규칙 (legacy 지원)
export interface LegacyValidation {
  minSelections?: number;
  maxSelections?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string | null;
  minDuration?: number;
  maxDuration?: number;
}

export interface Question {
  questionId: string;
  title: string;
  sectionId: string;
  questionType: QuestionType;
  promptType: PromptType;
  prompt: string;
  importance: Importance;
  required: boolean;
  validation: ValidationRule | LegacyValidation;
  options?: QuestionOption[];
  audio?: AudioMetadata;
  displayType?: DisplayType;
  placeholder?: string;
  nextQuestion: string | Record<string, string> | null;
}

// 질문 타입별 기본 템플릿
export const QUESTION_TEMPLATES: Record<QuestionType, Partial<Question>> = {
  multiple_choice: {
    questionType: 'multiple_choice',
    promptType: 'text_prompt',
    prompt: '질문을 입력하세요.',
    importance: 'medium',
    required: true,
    displayType: 'default',
    validation: {
      minSelections: 1,
      maxSelections: 1,
    },
    options: [
      { value: '1', label: '옵션 1', score: 1 },
      { value: '2', label: '옵션 2', score: 2 },
    ],
  },
  text_opinion: {
    questionType: 'text_opinion',
    promptType: 'text_prompt',
    prompt: '의견을 입력해 주세요.',
    importance: 'medium',
    required: false,
    placeholder: '자유롭게 의견을 작성해 주세요.',
    validation: {
      minLength: 0,
      maxLength: 1000,
      pattern: null,
    },
  },
  voice_opinion: {
    questionType: 'voice_opinion',
    promptType: 'voice_prompt',
    prompt: '',
    importance: 'medium',
    required: false,
    audio: {
      format: 'mp3',
      maxRecordingTime: 120,
      hasTranscript: true,
      transcript: '음성으로 의견을 말씀해 주세요.',
    },
    validation: {
      minDuration: 5,
      maxDuration: 120,
    },
  },
};

// 질문 타입별 라벨
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: '객관식',
  text_opinion: '텍스트 의견',
  voice_opinion: '음성 의견',
};

// 중요도별 라벨
export const IMPORTANCE_LABELS: Record<Importance, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '매우 높음',
};
