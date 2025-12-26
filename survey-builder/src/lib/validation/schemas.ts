// lib/validation/schemas.ts - Zod 검증 스키마

import { z } from 'zod';

// 기본 타입 스키마
export const questionTypeSchema = z.enum([
  'multiple_choice',
  'text_opinion',
  'voice_opinion',
]);

export const repeatModeSchema = z.enum(['none', 'fixed', 'limit']);

// 옵션 스키마
export const optionSchema = z.object({
  optionId: z.string().min(1, '옵션 ID는 필수입니다'),
  value: z.string().min(1, '옵션 값은 필수입니다'),
  label: z.string().min(1, '옵션 라벨은 필수입니다'),
  score: z.number().optional(),
  nextQuestionId: z.string().optional(),
});

// TTS 설정 스키마
export const ttsConfigSchema = z.object({
  engine: z.enum(['google', 'azure', 'polly']).default('google'),
  voice: z.string().default('ko-KR-Standard-A'),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(0.5).max(2.0).default(1.0),
});

// STT 설정 스키마
export const sttConfigSchema = z.object({
  engine: z.enum(['google', 'azure', 'whisper']).default('google'),
  language: z.string().default('ko-KR'),
  maxDuration: z.number().min(1).max(300).default(60),
});

// 검증 규칙 스키마
export const validationRuleSchema = z.object({
  type: z.enum(['required', 'minLength', 'maxLength', 'pattern', 'custom']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string().optional(),
});

// 분기 조건 스키마
export const branchConditionSchema = z.object({
  conditionId: z.string(),
  type: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'regex']),
  value: z.union([z.string(), z.number()]),
  targetQuestionId: z.string(),
});

// 질문 스키마
export const questionSchema = z.object({
  questionId: z.string().min(1, '질문 ID는 필수입니다'),
  questionType: questionTypeSchema,
  title: z.string().min(1, '질문 제목은 필수입니다'),
  description: z.string().optional(),
  promptText: z.string().min(1, '프롬프트 텍스트는 필수입니다'),
  options: z.array(optionSchema).optional(),
  validation: z.array(validationRuleSchema).optional(),
  branching: z.object({
    defaultNextQuestionId: z.string().optional(),
    conditions: z.array(branchConditionSchema).optional(),
  }).optional(),
  ttsConfig: ttsConfigSchema.optional(),
  sttConfig: sttConfigSchema.optional(),
  repeatMode: repeatModeSchema.optional(),
  maxRepeat: z.number().min(1).max(10).optional(),
  order: z.number().min(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// 섹션 스키마
export const sectionSchema = z.object({
  sectionId: z.string().min(1, '섹션 ID는 필수입니다'),
  title: z.string().min(1, '섹션 제목은 필수입니다'),
  description: z.string().optional(),
  questionIds: z.array(z.string()),
  order: z.number().min(0),
});

// 설문 설정 스키마
export const surveySettingsSchema = z.object({
  allowBack: z.boolean().default(true),
  showProgress: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(false),
  timeLimit: z.number().min(0).optional(),
  maxAttempts: z.number().min(1).optional(),
  greetingMessage: z.string().optional(),
  completionMessage: z.string().optional(),
});

// 전체 설문 스키마
export const surveySchema = z.object({
  surveyId: z.string().min(1, '설문 ID는 필수입니다'),
  version: z.string().default('1.0.0'),
  title: z.string().min(1, '설문 제목은 필수입니다'),
  description: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  questions: z.array(questionSchema).min(1, '최소 1개의 질문이 필요합니다'),
  sections: z.array(sectionSchema).optional(),
  settings: surveySettingsSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// 타입 추론
export type SurveySchemaType = z.infer<typeof surveySchema>;
export type QuestionSchemaType = z.infer<typeof questionSchema>;
export type OptionSchemaType = z.infer<typeof optionSchema>;

// 검증 함수
export function validateSurvey(data: unknown): {
  success: boolean;
  data?: SurveySchemaType;
  errors?: z.ZodError;
} {
  const result = surveySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function validateQuestion(data: unknown): {
  success: boolean;
  data?: QuestionSchemaType;
  errors?: z.ZodError;
} {
  const result = questionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// 부분 검증 (draft 모드)
export const partialQuestionSchema = questionSchema.partial().required({
  questionId: true,
  questionType: true,
});

export function validatePartialQuestion(data: unknown) {
  return partialQuestionSchema.safeParse(data);
}
