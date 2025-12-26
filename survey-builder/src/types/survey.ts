// types/survey.ts - 설문 관련 타입 정의

export type Language = 'ko' | 'en' | 'ja';

export interface Creator {
  name: string;
  department: string;
  email: string;
}

export interface OffTime {
  name: string;
  start: string;
  end: string;
}

export interface Schedule {
  date: { start: string; end: string };
  time: { start: string; end: string };
  offtime: OffTime[];
  timeZone: string;
}

export interface AnalyticsSettings {
  trackingEnabled: boolean;
  collectMetadata: string[];
}

export interface SurveySettings {
  allowAnonymous: boolean;
  allowRevision: boolean;
  estimatedDuration: number;
  showProgress: boolean;
  randomizeQuestions: boolean;
  requireAllQuestions: boolean;
  analytics: AnalyticsSettings;
}

export interface Section {
  sectionId: string;
  title: string;
  description: string;
  questionIds: string[];
  required: boolean;
}

// Question 타입은 question.ts에서 import
import type { Question } from './question';

export interface Survey {
  surveyId: string;
  version: string;
  title: string;
  description: string;
  language: Language;
  supportedLanguages: Language[];
  creator: Creator;
  schedule: Schedule;
  settings: SurveySettings;
  sections: Section[];
  questions: Question[];
  // UI 레이아웃 상태 (좌표 등)
  layout?: {
    nodes: any[];
    edges: any[];
  };
}

// 새 설문 생성 시 기본값
export const DEFAULT_SURVEY: Omit<Survey, 'questions' | 'sections'> = {
  surveyId: '',
  version: '1.0',
  title: '새 설문조사',
  description: '',
  language: 'ko',
  supportedLanguages: ['ko'],
  creator: {
    name: '',
    department: '',
    email: '',
  },
  schedule: {
    date: { start: '', end: '' },
    time: { start: '09:00:00', end: '18:00:00' },
    offtime: [],
    timeZone: 'Asia/Seoul',
  },
  settings: {
    allowAnonymous: true,
    allowRevision: true,
    estimatedDuration: 10,
    showProgress: true,
    randomizeQuestions: false,
    requireAllQuestions: false,
    analytics: {
      trackingEnabled: false,
      collectMetadata: [],
    },
  },
};
