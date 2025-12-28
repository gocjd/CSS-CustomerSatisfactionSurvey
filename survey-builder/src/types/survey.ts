// types/survey.ts - 설문 관련 타입 정의

import type { Question } from './question';
export type { Question } from './question';

// 언어 타입
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es';

// 작성자 정보
export interface Creator {
  name: string;
  department?: string;
  email?: string;
  phone?: string;
}

// 비운영 시간
export interface OffTime {
  name: string;
  start: string; // HH:mm:ss
  end: string;   // HH:mm:ss
}

// 스케줄
export interface Schedule {
  date: {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
  };
  time?: {
    start: string; // HH:mm:ss
    end: string;   // HH:mm:ss
  };
  offtime?: OffTime[];
  timeZone?: string;
}

// 분석 설정
export interface AnalyticsSettings {
  trackingEnabled: boolean;
  collectMetadata?: string[];
}

// 설정
export interface SurveySettings {
  allowAnonymous?: boolean;
  allowRevision?: boolean;
  estimatedDuration?: number; // minutes
  showProgress?: boolean;
  randomizeQuestions?: boolean;
  requireAllQuestions?: boolean;
  analytics?: AnalyticsSettings;
}

// 섹션
export interface Section {
  sectionId: string;
  title: string;
  description?: string;
  questionIds: string[];
  required?: boolean;
}

// 레이아웃 노드 (시각적 위치 정보)
export interface LayoutNode {
  id: string;
  position: {
    x: number;
    y: number;
  };
  type?: 'start' | 'end' | 'question';
}

// 레이아웃 엣지
export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;
}

// 레이아웃
export interface Layout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

// 설문
export interface Survey {
  surveyId: string;
  version: string;
  title: string;
  description?: string;
  language: Language;
  supportedLanguages?: Language[];
  creator?: Creator;
  schedule?: Schedule;
  settings?: SurveySettings;
  sections: Section[];
  questions: Question[];
  layout?: Layout;
}

// 설문 문제 (렌더링용 간단한 형식)
export interface SurveyQuestion {
  id: string;
  type: 'choice' | 'rating' | 'text' | 'boolean' | 'slider' | 'checkbox';
  text: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  labels?: Record<string | number, string>;
  placeholder?: string;
}

// 설문 데이터 (렌더링용 간단한 형식)
export interface SurveyData {
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}

// 기본 설문
export const DEFAULT_SURVEY: Omit<Survey, 'surveyId'> = {
  version: '1.0.0',
  title: '새로운 설문',
  description: '설명을 입력하세요.',
  language: 'ko',
  supportedLanguages: ['ko', 'en'],
  creator: {
    name: '작성자',
    department: '부서',
    email: '',
    phone: '',
  },
  schedule: {
    date: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    time: {
      start: '09:00:00',
      end: '18:00:00',
    },
    offtime: [],
    timeZone: 'Asia/Seoul',
  },
  settings: {
    allowAnonymous: false,
    allowRevision: true,
    estimatedDuration: 15,
    showProgress: true,
    randomizeQuestions: false,
    requireAllQuestions: true,
    analytics: {
      trackingEnabled: true,
      collectMetadata: ['device', 'location', 'duration'],
    },
  },
  sections: [
    {
      sectionId: 'SEC1',
      title: '섹션 1',
      description: '',
      questionIds: [],
      required: true,
    },
  ],
  questions: [],
  layout: undefined,
};
