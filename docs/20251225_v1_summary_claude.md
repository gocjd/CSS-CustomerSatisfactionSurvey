# 고객만족도 조사 시스템 (CSS) - Claude의 구현 설계서

## Claude Opus 4.5의 Antigravity 설계 분석 및 구현 가이드

**작성일**: 2024년 12월 25일
**작성자**: Claude Opus 4.5
**기반 문서**: 20251225_v1_summary_antigravity.md
**목적**: Antigravity 설계 분석, 보완 의견 제시, 실제 구현을 위한 상세 설계 및 개발 방법론 제공

---

## 1. Antigravity 설계 분석 및 평가

### 1-1. 설계 강점 분석

Antigravity의 설계는 다음과 같은 강점을 보유하고 있습니다:

| 영역 | 강점 | 평가 |
|------|------|------|
| **아키텍처** | Data-Centric + Visual Authoring 이중 축 정의 | 우수 |
| **기술 스택** | 현대적이고 검증된 라이브러리 조합 | 우수 |
| **UX 설계** | Google Opal 스타일의 직관적 노드 그래프 | 우수 |
| **포트 시스템** | Input/Output 포트 분리 및 동적 생성 | 매우 우수 |
| **검증 시스템** | Loop Detection, Orphan Check 등 실시간 검증 | 우수 |

### 1-2. 보완 및 개선 제안

#### A. 기술 스택 현행화

현재 프로젝트는 이미 다음 기술 스택이 설정되어 있습니다:

```json
{
  "next": "16.1.1",           // Antigravity 제안: 14+ (현재 더 최신)
  "react": "19.2.3",          // React 19 사용 중
  "@xyflow/react": "^12.10.0", // React Flow 최신 버전
  "zustand": "^5.0.9",        // Zustand 최신 버전
  "immer": "^11.1.0",         // Immer 최신 버전
  "zod": "^4.2.1"             // Zod 최신 버전
}
```

**결론**: 기술 스택은 Antigravity 제안보다 더 최신 버전으로 이미 구성되어 있어 그대로 사용합니다.

#### B. 추가 아키텍처 고려사항

1. **Undo/Redo 시스템**: Antigravity 설계에 명시되지 않았으나 필수 기능
2. **키보드 단축키**: 접근성 및 파워 유저를 위한 단축키 시스템
3. **다크모드 지원**: 기존 설계 문서에 명시된 요구사항
4. **반응형 대응**: 태블릿에서의 사용 시나리오 고려
5. **오프라인 저장**: LocalStorage 기반 임시 저장 기능

#### C. 성능 최적화 포인트

1. **가상화(Virtualization)**: 100개 이상 노드 시 React Flow의 nodeTypes 메모이제이션
2. **Lazy Loading**: PropertyPanel의 탭 컨텐츠 지연 로딩
3. **Debounced Validation**: 입력 시 검증 지연 처리 (300ms)

---

## 2. 상세 시스템 아키텍처

### 2-1. 디렉토리 구조 설계

```
survey-builder/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root Layout
│   │   ├── page.tsx                # Entry Selector Page
│   │   └── builder/
│   │       └── page.tsx            # Builder Main Page
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 컴포넌트 (기존)
│   │   │
│   │   ├── entry/                  # 진입 관련 컴포넌트
│   │   │   ├── TemplateGallery.tsx
│   │   │   ├── SurveyHistoryList.tsx
│   │   │   └── NewSurveyButton.tsx
│   │   │
│   │   ├── builder/                # 빌더 핵심 컴포넌트
│   │   │   ├── BuilderHeader.tsx
│   │   │   ├── BuilderLayout.tsx
│   │   │   ├── BuilderFooter.tsx
│   │   │   │
│   │   │   ├── canvas/             # Canvas 관련
│   │   │   │   ├── CanvasArea.tsx
│   │   │   │   ├── CanvasControls.tsx
│   │   │   │   └── MiniMap.tsx
│   │   │   │
│   │   │   ├── palette/            # 질문 팔레트
│   │   │   │   ├── QuestionPalette.tsx
│   │   │   │   └── PaletteItem.tsx
│   │   │   │
│   │   │   ├── property/           # 속성 패널
│   │   │   │   ├── PropertyPanel.tsx
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── BasicInfoTab.tsx
│   │   │   │   │   ├── OptionsTab.tsx
│   │   │   │   │   ├── ValidationTab.tsx
│   │   │   │   │   ├── BranchingTab.tsx
│   │   │   │   │   └── StyleTab.tsx
│   │   │   │   └── editors/
│   │   │   │       ├── OptionEditor.tsx
│   │   │   │       └── AudioUploader.tsx
│   │   │   │
│   │   │   └── nodes/              # React Flow 커스텀 노드
│   │   │       ├── QuestionNode.tsx
│   │   │       ├── StartNode.tsx
│   │   │       ├── EndNode.tsx
│   │   │       ├── SectionNode.tsx
│   │   │       └── nodeTypes.ts
│   │   │
│   │   └── shared/                 # 공유 컴포넌트
│   │       ├── ConfirmDialog.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── stores/                     # Zustand 스토어
│   │   ├── useSurveyStore.ts       # 메인 설문 상태
│   │   ├── useUIStore.ts           # UI 상태
│   │   └── useHistoryStore.ts      # Undo/Redo 히스토리
│   │
│   ├── hooks/                      # 커스텀 훅
│   │   ├── useAutoSave.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useValidation.ts
│   │   └── useGraphTransform.ts
│   │
│   ├── lib/                        # 유틸리티
│   │   ├── utils.ts                # 기존 유틸
│   │   ├── validation/
│   │   │   ├── schemas.ts          # Zod 스키마 정의
│   │   │   ├── validators.ts       # 검증 함수
│   │   │   └── graphValidator.ts   # 그래프 검증 (Loop, Orphan)
│   │   │
│   │   └── transform/
│   │       ├── jsonToGraph.ts      # JSON -> React Flow 변환
│   │       ├── graphToJson.ts      # React Flow -> JSON 변환
│   │       └── autoLayout.ts       # Dagre 기반 자동 레이아웃
│   │
│   └── types/                      # TypeScript 타입 정의
│       ├── survey.ts               # 설문 관련 타입
│       ├── question.ts             # 질문 관련 타입
│       ├── graph.ts                # 그래프 관련 타입
│       └── index.ts                # 타입 익스포트
│
├── public/
│   └── audio_files/                # 오디오 파일 저장소
│
└── tests/                          # 테스트 파일
    ├── e2e/                        # Playwright E2E 테스트
    └── unit/                       # 단위 테스트
```

### 2-2. 핵심 타입 정의

```typescript
// types/survey.ts
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
}

export type Language = 'ko' | 'en' | 'ja';

export interface Creator {
  name: string;
  department: string;
  email: string;
}

export interface Schedule {
  date: { start: string; end: string };
  time: { start: string; end: string };
  offtime: OffTime[];
  timeZone: string;
}

export interface OffTime {
  name: string;
  start: string;
  end: string;
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

// types/question.ts
export type QuestionType =
  | 'multiple_choice'
  | 'text_opinion'
  | 'voice_opinion';

export type PromptType = 'text_prompt' | 'voice_prompt';
export type DisplayType = 'default' | 'likert_scale';
export type Importance = 'low' | 'medium' | 'high' | 'critical';

export interface Question {
  questionId: string;
  title: string;
  sectionId: string;
  questionType: QuestionType;
  promptType: PromptType;
  prompt: string;
  importance: Importance;
  required: boolean;
  validation: ValidationRule;
  options?: QuestionOption[];
  audio?: AudioMetadata;
  displayType?: DisplayType;
  placeholder?: string;
  nextQuestion: string | Record<string, string> | null;
}

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

// types/graph.ts
import { Node, Edge } from '@xyflow/react';

export interface QuestionNodeData {
  question: Question;
  isSelected: boolean;
  hasError: boolean;
  errorMessages: string[];
}

export type QuestionNode = Node<QuestionNodeData, 'question'>;
export type SurveyEdge = Edge<{ condition?: string }>;

export interface GraphState {
  nodes: QuestionNode[];
  edges: SurveyEdge[];
}
```

### 2-3. Zustand 스토어 설계

```typescript
// stores/useSurveyStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Survey, Question, Section } from '@/types';
import { QuestionNode, SurveyEdge, GraphState } from '@/types/graph';

interface SurveyState {
  // 설문 메타데이터
  survey: Survey | null;
  isDirty: boolean;

  // 그래프 상태
  nodes: QuestionNode[];
  edges: SurveyEdge[];

  // 선택 상태
  selectedNodeId: string | null;

  // 검증 상태
  validationErrors: Map<string, string[]>;
  isValid: boolean;

  // 액션
  actions: {
    // 설문 관리
    initSurvey: (survey: Survey) => void;
    createNewSurvey: () => void;
    updateSurveyMeta: (meta: Partial<Survey>) => void;

    // 노드 관리
    addNode: (question: Question, position: { x: number; y: number }) => void;
    updateNode: (nodeId: string, data: Partial<Question>) => void;
    deleteNode: (nodeId: string) => void;
    selectNode: (nodeId: string | null) => void;

    // 엣지 관리
    addEdge: (source: string, target: string, condition?: string) => void;
    deleteEdge: (edgeId: string) => void;

    // 변환
    exportToJson: () => Survey;
    importFromJson: (json: Survey) => void;

    // 검증
    validate: () => boolean;
    clearErrors: () => void;
  };
}

export const useSurveyStore = create<SurveyState>()(
  immer((set, get) => ({
    survey: null,
    isDirty: false,
    nodes: [],
    edges: [],
    selectedNodeId: null,
    validationErrors: new Map(),
    isValid: true,

    actions: {
      // 구현 상세...
    }
  }))
);
```

---

## 3. React Flow 노드 구현 상세

### 3-1. QuestionNode 컴포넌트

```typescript
// components/builder/nodes/QuestionNode.tsx
import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { QuestionNodeData } from '@/types/graph';
import {
  ListChecks,
  MessageSquare,
  Mic,
  AlertCircle,
  Settings
} from 'lucide-react';

const questionTypeIcons = {
  multiple_choice: ListChecks,
  text_opinion: MessageSquare,
  voice_opinion: Mic,
} as const;

export const QuestionNode = memo(({ data, selected }: NodeProps<QuestionNodeData>) => {
  const { question, hasError, errorMessages } = data;
  const Icon = questionTypeIcons[question.questionType];

  // 조건부 분기인 경우 Output 포트 계산
  const outputPorts = useMemo(() => {
    if (typeof question.nextQuestion === 'object' && question.nextQuestion !== null) {
      return Object.entries(question.nextQuestion).map(([value, targetId]) => ({
        id: `output-${value}`,
        label: question.options?.find(o => o.value === value)?.label || value,
        value,
      }));
    }
    return [{ id: 'output-default', label: 'Next', value: 'default' }];
  }, [question.nextQuestion, question.options]);

  return (
    <div
      className={cn(
        'min-w-[280px] max-w-[320px] rounded-lg border-2 bg-white shadow-md transition-all',
        selected && 'border-blue-500 ring-2 ring-blue-200',
        hasError && 'border-red-500',
        !selected && !hasError && 'border-gray-200 hover:border-gray-300'
      )}
    >
      {/* Input Port (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm text-gray-900">
            {question.questionId}. {question.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {question.required && (
            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
              필수
            </span>
          )}
          {hasError && <AlertCircle className="w-4 h-4 text-red-500" />}
          <button className="p-1 hover:bg-gray-200 rounded">
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Body - Prompt Preview */}
      <div className="px-3 py-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {question.promptType === 'voice_prompt'
            ? question.audio?.transcript || '음성 프롬프트'
            : question.prompt}
        </p>
        <div className="mt-2 flex gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-gray-100 rounded">
            {getQuestionTypeLabel(question.questionType)}
          </span>
          {question.displayType === 'likert_scale' && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
              Likert
            </span>
          )}
        </div>
      </div>

      {/* Output Ports (Right) */}
      <div className="border-t bg-gray-50 rounded-b-lg">
        {outputPorts.map((port, index) => (
          <div
            key={port.id}
            className="relative flex items-center justify-end px-3 py-1.5"
          >
            <span className="text-xs text-gray-500 mr-2">{port.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              className={cn(
                '!w-3 !h-3 !border-2 !border-white',
                port.value === 'default' ? '!bg-green-500' : '!bg-orange-500'
              )}
              style={{ top: 'auto', position: 'relative' }}
            />
          </div>
        ))}
      </div>

      {/* Error Messages Tooltip */}
      {hasError && errorMessages.length > 0 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full
                        bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
          {errorMessages[0]}
        </div>
      )}
    </div>
  );
});

QuestionNode.displayName = 'QuestionNode';

function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    multiple_choice: '객관식',
    text_opinion: '텍스트 의견',
    voice_opinion: '음성 의견',
  };
  return labels[type] || type;
}
```

### 3-2. 노드 타입 등록

```typescript
// components/builder/nodes/nodeTypes.ts
import { NodeTypes } from '@xyflow/react';
import { QuestionNode } from './QuestionNode';
import { StartNode } from './StartNode';
import { EndNode } from './EndNode';

export const nodeTypes: NodeTypes = {
  question: QuestionNode,
  start: StartNode,
  end: EndNode,
};
```

---

## 4. 그래프 변환 로직 구현

### 4-1. JSON to Graph 변환

```typescript
// lib/transform/jsonToGraph.ts
import { Node, Edge } from '@xyflow/react';
import { Survey, Question } from '@/types';
import { QuestionNode, SurveyEdge } from '@/types/graph';
import Dagre from '@dagrejs/dagre';

interface TransformResult {
  nodes: QuestionNode[];
  edges: SurveyEdge[];
}

export function jsonToGraph(survey: Survey): TransformResult {
  const nodes: QuestionNode[] = [];
  const edges: SurveyEdge[] = [];

  // 1. 질문을 노드로 변환
  survey.questions.forEach((question, index) => {
    nodes.push({
      id: question.questionId,
      type: 'question',
      position: { x: 0, y: 0 }, // 나중에 자동 레이아웃으로 계산
      data: {
        question,
        isSelected: false,
        hasError: false,
        errorMessages: [],
      },
    });
  });

  // 2. nextQuestion을 엣지로 변환
  survey.questions.forEach((question) => {
    const { nextQuestion } = question;

    if (nextQuestion === null) {
      // 종료 노드
      return;
    }

    if (typeof nextQuestion === 'string') {
      // 단순 연결
      edges.push({
        id: `${question.questionId}-${nextQuestion}`,
        source: question.questionId,
        target: nextQuestion,
        sourceHandle: 'output-default',
        targetHandle: 'input',
      });
    } else if (typeof nextQuestion === 'object') {
      // 조건부 분기
      Object.entries(nextQuestion).forEach(([optionValue, targetId]) => {
        edges.push({
          id: `${question.questionId}-${optionValue}-${targetId}`,
          source: question.questionId,
          target: targetId,
          sourceHandle: `output-${optionValue}`,
          targetHandle: 'input',
          data: { condition: optionValue },
        });
      });
    }
  });

  // 3. 자동 레이아웃 적용
  const layoutedNodes = applyDagreLayout(nodes, edges);

  return { nodes: layoutedNodes, edges };
}

function applyDagreLayout(nodes: QuestionNode[], edges: SurveyEdge[]): QuestionNode[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: 'LR',      // Left to Right
    nodesep: 80,        // 노드 간 수직 간격
    ranksep: 150,       // 노드 간 수평 간격
    marginx: 50,
    marginy: 50,
  });

  // 노드 추가
  nodes.forEach((node) => {
    g.setNode(node.id, { width: 300, height: 120 });
  });

  // 엣지 추가
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // 레이아웃 계산
  Dagre.layout(g);

  // 계산된 위치 적용
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 150, // 중심점 조정
        y: nodeWithPosition.y - 60,
      },
    };
  });
}
```

### 4-2. Graph to JSON 변환

```typescript
// lib/transform/graphToJson.ts
import { Survey, Question, Section } from '@/types';
import { QuestionNode, SurveyEdge } from '@/types/graph';

interface GraphData {
  nodes: QuestionNode[];
  edges: SurveyEdge[];
  surveyMeta: Omit<Survey, 'questions' | 'sections'>;
}

export function graphToJson(data: GraphData): Survey {
  const { nodes, edges, surveyMeta } = data;

  // 노드에서 질문 추출 및 nextQuestion 재구성
  const questions: Question[] = nodes.map((node) => {
    const question = { ...node.data.question };

    // 해당 노드에서 나가는 엣지 찾기
    const outgoingEdges = edges.filter((e) => e.source === node.id);

    if (outgoingEdges.length === 0) {
      question.nextQuestion = null;
    } else if (outgoingEdges.length === 1 && !outgoingEdges[0].data?.condition) {
      question.nextQuestion = outgoingEdges[0].target;
    } else {
      // 조건부 분기
      const branchMap: Record<string, string> = {};
      outgoingEdges.forEach((edge) => {
        const condition = edge.data?.condition || edge.sourceHandle?.replace('output-', '');
        if (condition) {
          branchMap[condition] = edge.target;
        }
      });
      question.nextQuestion = branchMap;
    }

    return question;
  });

  // 섹션 재구성 (기존 섹션 정보 유지 또는 재생성)
  const sections = reconstructSections(questions, surveyMeta.sections);

  return {
    ...surveyMeta,
    sections,
    questions,
  };
}

function reconstructSections(
  questions: Question[],
  existingSections?: Section[]
): Section[] {
  // 섹션 ID별로 질문 그룹화
  const sectionMap = new Map<string, string[]>();

  questions.forEach((q) => {
    const existing = sectionMap.get(q.sectionId) || [];
    existing.push(q.questionId);
    sectionMap.set(q.sectionId, existing);
  });

  // 기존 섹션 정보와 병합
  if (existingSections) {
    return existingSections.map((section) => ({
      ...section,
      questionIds: sectionMap.get(section.sectionId) || [],
    }));
  }

  // 새 섹션 생성
  return Array.from(sectionMap.entries()).map(([sectionId, questionIds], index) => ({
    sectionId,
    title: `섹션 ${index + 1}`,
    description: '',
    questionIds,
    required: true,
  }));
}
```

---

## 5. 실시간 검증 시스템 구현

### 5-1. Zod 스키마 정의

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const QuestionOptionSchema = z.object({
  value: z.string().min(1, '옵션 값은 필수입니다'),
  label: z.string().min(1, '옵션 레이블은 필수입니다'),
  score: z.number().int().min(0).max(100),
  category: z.string().optional(),
});

export const AudioMetadataSchema = z.object({
  format: z.enum(['mp3', 'wav']),
  duration: z.number().positive().optional(),
  maxRecordingTime: z.number().positive().max(300).optional(),
  hasTranscript: z.boolean(),
  transcript: z.string().optional(),
});

export const ValidationRuleSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('selection'),
    minSelections: z.number().int().min(1),
    maxSelections: z.number().int().min(1),
  }),
  z.object({
    type: z.literal('text'),
    minLength: z.number().int().min(0),
    maxLength: z.number().int().max(10000),
    pattern: z.string().nullable(),
  }),
  z.object({
    type: z.literal('audio'),
    minDuration: z.number().int().min(0),
    maxDuration: z.number().int().max(300),
  }),
]);

export const QuestionSchema = z.object({
  questionId: z.string().regex(/^Q\d+$/, '질문 ID는 Q1, Q2 형식이어야 합니다'),
  title: z.string().min(1, '질문 제목은 필수입니다').max(100),
  sectionId: z.string().regex(/^SEC\d+$/, '섹션 ID는 SEC1, SEC2 형식이어야 합니다'),
  questionType: z.enum(['multiple_choice', 'text_opinion', 'voice_opinion']),
  promptType: z.enum(['text_prompt', 'voice_prompt']),
  prompt: z.string().min(1, '프롬프트는 필수입니다'),
  importance: z.enum(['low', 'medium', 'high', 'critical']),
  required: z.boolean(),
  options: z.array(QuestionOptionSchema).optional(),
  audio: AudioMetadataSchema.optional(),
  displayType: z.enum(['default', 'likert_scale']).optional(),
  nextQuestion: z.union([
    z.string(),
    z.record(z.string()),
    z.null(),
  ]),
}).refine(
  (data) => {
    // multiple_choice는 반드시 options가 있어야 함
    if (data.questionType === 'multiple_choice') {
      return data.options && data.options.length >= 2;
    }
    return true;
  },
  { message: '객관식 질문은 최소 2개의 옵션이 필요합니다' }
).refine(
  (data) => {
    // voice_prompt는 반드시 audio가 있어야 함
    if (data.promptType === 'voice_prompt') {
      return !!data.audio;
    }
    return true;
  },
  { message: '음성 프롬프트는 오디오 메타데이터가 필요합니다' }
);

export const SurveySchema = z.object({
  surveyId: z.string().regex(/^CS\d{7}$/, 'Survey ID는 CS + 7자리 숫자 형식이어야 합니다'),
  version: z.string().regex(/^\d+\.\d+$/, '버전은 1.0 형식이어야 합니다'),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  language: z.enum(['ko', 'en', 'ja']),
  supportedLanguages: z.array(z.enum(['ko', 'en', 'ja'])).min(1),
  questions: z.array(QuestionSchema).min(1, '최소 1개의 질문이 필요합니다'),
});
```

### 5-2. 그래프 검증 로직

```typescript
// lib/validation/graphValidator.ts
import { QuestionNode, SurveyEdge } from '@/types/graph';

interface ValidationResult {
  isValid: boolean;
  errors: GraphError[];
}

interface GraphError {
  type: 'loop' | 'orphan' | 'dangling' | 'missing_connection';
  nodeId: string;
  message: string;
}

export function validateGraph(
  nodes: QuestionNode[],
  edges: SurveyEdge[]
): ValidationResult {
  const errors: GraphError[] = [];

  // 1. Loop Detection (순환 참조 감지)
  const loopErrors = detectLoops(nodes, edges);
  errors.push(...loopErrors);

  // 2. Orphan Detection (고립 노드 감지)
  const orphanErrors = detectOrphans(nodes, edges);
  errors.push(...orphanErrors);

  // 3. Dangling Port Detection (연결되지 않은 포트)
  const danglingErrors = detectDanglingPorts(nodes, edges);
  errors.push(...danglingErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function detectLoops(nodes: QuestionNode[], edges: SurveyEdge[]): GraphError[] {
  const errors: GraphError[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // 인접 리스트 구성
  const adjacency = new Map<string, string[]>();
  nodes.forEach((node) => adjacency.set(node.id, []));
  edges.forEach((edge) => {
    const neighbors = adjacency.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  });

  // DFS로 사이클 감지
  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path, nodeId])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        errors.push({
          type: 'loop',
          nodeId: neighbor,
          message: `순환 참조가 감지되었습니다: ${[...path, nodeId, neighbor].join(' -> ')}`,
        });
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return errors;
}

function detectOrphans(nodes: QuestionNode[], edges: SurveyEdge[]): GraphError[] {
  const errors: GraphError[] = [];

  // 첫 번째 노드(시작 노드)에서 도달 가능한 노드 찾기
  const startNode = nodes[0];
  if (!startNode) return errors;

  const reachable = new Set<string>();
  const queue = [startNode.id];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;
    reachable.add(current);

    edges
      .filter((e) => e.source === current)
      .forEach((e) => queue.push(e.target));
  }

  // 도달 불가능한 노드 찾기
  nodes.forEach((node) => {
    if (!reachable.has(node.id) && node.id !== startNode.id) {
      errors.push({
        type: 'orphan',
        nodeId: node.id,
        message: `'${node.data.question.title}' 질문은 시작점에서 도달할 수 없습니다`,
      });
    }
  });

  return errors;
}

function detectDanglingPorts(
  nodes: QuestionNode[],
  edges: SurveyEdge[]
): GraphError[] {
  const errors: GraphError[] = [];

  nodes.forEach((node) => {
    const question = node.data.question;

    // 마지막 질문이 아닌데 나가는 연결이 없는 경우
    if (question.nextQuestion !== null) {
      const hasOutgoingEdge = edges.some((e) => e.source === node.id);
      if (!hasOutgoingEdge) {
        errors.push({
          type: 'dangling',
          nodeId: node.id,
          message: `'${question.title}' 질문에 다음 연결이 없습니다`,
        });
      }
    }

    // 조건부 분기인데 일부 옵션에 연결이 없는 경우
    if (typeof question.nextQuestion === 'object' && question.nextQuestion !== null) {
      const connectedOptions = new Set(
        edges
          .filter((e) => e.source === node.id)
          .map((e) => e.data?.condition || e.sourceHandle?.replace('output-', ''))
      );

      question.options?.forEach((option) => {
        if (!connectedOptions.has(option.value)) {
          errors.push({
            type: 'missing_connection',
            nodeId: node.id,
            message: `'${question.title}'의 '${option.label}' 옵션에 연결이 없습니다`,
          });
        }
      });
    }
  });

  return errors;
}
```

---

## 6. 개발 방법론 및 컨벤션

### 6-1. 코드 컨벤션

```typescript
// 1. 컴포넌트 네이밍: PascalCase
export const QuestionNode = () => { ... };

// 2. 훅 네이밍: use 접두사
export const useAutoSave = () => { ... };

// 3. 유틸리티 함수: camelCase
export function jsonToGraph(survey: Survey) { ... }

// 4. 타입/인터페이스: PascalCase
interface QuestionNodeData { ... }
type QuestionType = 'multiple_choice' | 'text_opinion' | 'voice_opinion';

// 5. 상수: UPPER_SNAKE_CASE
const MAX_QUESTIONS = 100;
const DEFAULT_NODE_WIDTH = 300;

// 6. 파일 네이밍
// - 컴포넌트: PascalCase.tsx (QuestionNode.tsx)
// - 훅: camelCase.ts (useAutoSave.ts)
// - 유틸: camelCase.ts (jsonToGraph.ts)
// - 타입: camelCase.ts (survey.ts)
```

### 6-2. 커밋 메시지 규칙

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**예시:**
```
feat(builder): QuestionNode 컴포넌트 구현

- 입력/출력 포트 분리 구조 적용
- 조건부 분기 시 동적 포트 생성
- 에러 상태 시각화 추가

Closes #12
```

### 6-3. 브랜치 전략

```
main
├── develop
│   ├── feature/builder-core
│   ├── feature/question-node
│   ├── feature/property-panel
│   └── feature/validation
└── release/v1.0.0
```

---

## 7. 구현 우선순위 및 체크리스트

### Phase 1: Core Engine & Visuals (우선순위: 최고)

- [ ] 프로젝트 디렉토리 구조 설정
- [ ] 타입 정의 (types/*.ts)
- [ ] Zustand 스토어 기본 구조 (useSurveyStore.ts)
- [ ] React Flow 기본 설정 (CanvasArea.tsx)
- [ ] QuestionNode 컴포넌트 구현
- [ ] StartNode, EndNode 구현
- [ ] 기본 드래그 앤 드롭 기능

### Phase 2: Logic & Branching (우선순위: 높음)

- [ ] 동적 포트 생성 로직
- [ ] 엣지 연결/삭제 기능
- [ ] 조건부 분기 데이터 처리
- [ ] 엣지 스타일링 (Bezier Curve)

### Phase 3: Property Editor & Schema Sync (우선순위: 높음)

- [ ] PropertyPanel 컴포넌트
- [ ] 탭별 편집 폼 구현
- [ ] Zod 스키마 검증
- [ ] JSON <-> Graph 양방향 변환
- [ ] 실시간 검증 시스템

### Phase 4: Polish & Export (우선순위: 중간)

- [ ] JSON 내보내기/불러오기
- [ ] 자동 레이아웃 (Dagre)
- [ ] Undo/Redo 시스템
- [ ] 키보드 단축키
- [ ] 다크모드 지원
- [ ] 애니메이션 및 UI 폴리싱

---

## 8. 결론

Antigravity의 설계는 "Google Opal 스타일의 노드 기반 비주얼 빌더"라는 명확한 비전과 함께 견고한 기술적 기반을 제시하고 있습니다. 본 구현 설계서는 해당 비전을 실제 코드로 구현하기 위한 상세한 가이드라인을 제공합니다.

**핵심 구현 원칙:**

1. **JSON Schema는 Source of Truth** - 모든 UI 상태는 JSON으로 직렬화/역직렬화 가능해야 함
2. **실시간 검증** - 사용자 실수를 즉시 피드백하여 무결성 유지
3. **직관적인 시각화** - 복잡한 분기 로직도 한눈에 파악 가능
4. **확장 가능한 아키텍처** - 향후 기능 추가에 유연하게 대응

---

**문서 버전**: v1.0
**최종 수정일**: 2024-12-25
**작성자**: Claude Opus 4.5
