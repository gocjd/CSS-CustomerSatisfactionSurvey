# 고객만족도 조사 시스템 (CSS) - AI 구축용 마스터 명세서
## v1.0 Complete Implementation Specification for AI Tools

**작성일**: 2024년 12월 23일  
**버전**: v1.0  
**목적**: AI 도구(Cursor AI, Claude Code, Anti Gravity)를 통한 실제 시스템 구축  
**상태**: 최종 확정 - 구현 준비 완료

---

## 📋 문서 개요

### 문서 목적
본 문서는 고객만족도 조사 시스템(CSS)의 **완전한 구현 명세서**로, AI 도구에 전달하여 실제 동작하는 시스템을 구축하기 위한 모든 정보를 포함합니다.

### 포함 내용
1. JSON 스키마 완전 정의
2. UI/UX 상세 설계
3. 설문 Builder 설계
4. 구현 강제 사항
5. 검증 패턴
6. 교차 검증 체크리스트

### 기반 문서
```
20251223_v1_css.json         → 설문 데이터 구조
20251223_v1_desc.md          → UI/UX 화면 설계
20251223_v1_plan.md          → JSON 스키마 설계서
20251223_v1_survey_builder_design.md → Builder 설계
```

---

## 🎯 시스템 핵심 요구사항

### 필수 구현 기능
```
✅ 설문 데이터 관리 (CRUD)
✅ 동적 질문 흐름 (분기 로직)
✅ 다양한 입력 방식 (객관식, 텍스트, 음성)
✅ 음성 프롬프트/녹음 지원
✅ 실시간 진행도 표시
✅ 자동 저장 기능
✅ 설문 Builder UI
✅ 반응형 디자인 (모바일/태블릿/데스크톱)
✅ 접근성 (WCAG AA)
```

### 기술 스택 권장
```
Frontend: React 18+ / Next.js 14+
State: Zustand / Redux Toolkit
Canvas: React Flow / D3.js
Styling: Tailwind CSS / Styled Components
Backend: Node.js / Express / NestJS
Database: PostgreSQL / MongoDB
API: RESTful / GraphQL
```

---

## 📊 JSON 스키마 완전 정의

### 1. 최상위 구조 (11개 필드)

```json
{
  "surveyId": "CS2024002",              // [필수] 고유 ID (CS+7자리)
  "version": "1.0",                     // [필수] 스키마 버전
  "title": "설문조사 제목",              // [필수] 5-100자
  "description": "설문조사 설명",        // [필수] 10-500자
  "language": "ko",                     // [필수] ISO 639-1
  "supportedLanguages": ["ko","en","ja"], // [필수] 1-5개
  "creator": {...},                     // [필수] 작성자 정보
  "schedule": {...},                    // [필수] 일정 정보
  "settings": {...},                    // [필수] 운영 설정
  "sections": [...],                    // [필수] 섹션 배열 (1-10개)
  "questions": [...]                    // [필수] 질문 배열 (3-99개)
}
```

### 2. Creator 구조 (필수 3개 필드)

```json
{
  "name": "담당자명",           // [필수] 2자 이상
  "department": "부서명",       // [필수] 3자 이상
  "email": "email@domain.com"  // [필수] 유효한 이메일
}
```

**검증 규칙**:
- name: 최소 2자, 최대 50자
- department: 최소 3자, 최대 100자
- email: RFC 5322 형식

### 3. Schedule 구조 (필수 4개 필드)

```json
{
  "date": {
    "start": "2024-01-15",    // ISO 8601
    "end": "2024-02-15"       // end >= start
  },
  "time": {
    "start": "09:00:00",      // HH:MM:SS
    "end": "18:00:00"         // end > start
  },
  "offtime": [
    {
      "name": "점심시간",
      "start": "12:00:00",
      "end": "13:00:00"
    }
  ],
  "timeZone": "Asia/Seoul"    // IANA 타임존
}
```

**검증 규칙**:
- date: end >= start (필수)
- time: end > start (필수)
- offtime: 배열, 0개 이상
- timeZone: IANA 형식

### 4. Settings 구조 (필수 6개 + analytics)

```json
{
  "allowAnonymous": false,         // [필수] boolean
  "allowRevision": true,           // [필수] boolean
  "estimatedDuration": 15,         // [필수] 1-180분
  "showProgress": true,            // [필수] boolean
  "randomizeQuestions": false,     // [필수] boolean
  "requireAllQuestions": true,     // [필수] boolean
  "analytics": {
    "trackingEnabled": true,
    "collectMetadata": ["device","location","duration"]
  }
}
```

### 5. Section 구조 (필수 5개 필드)

```json
{
  "sectionId": "SEC1",                    // [필수] SEC+숫자, 고유
  "title": "기본 정보",                   // [필수] 5-50자
  "description": "응답자 기본 정보 수집", // [필수] 10-200자
  "questionIds": ["Q1"],                 // [필수] 1개 이상
  "required": true                       // [필수] boolean
}
```

**검증 규칙**:
- sectionId: 고유, SEC+숫자 형식
- questionIds: 모든 ID가 questions 배열에 존재
- 최소 1개, 최대 10개 섹션

### 6. Question 구조 (필수 11개 필드)

```json
{
  "questionId": "Q1",                    // [필수] Q+숫자, 고유
  "title": "연령대",                     // [필수] 3-30자, 고유
  "sectionId": "SEC1",                   // [필수] 유효한 sectionId
  "questionType": "multiple_choice",     // [필수] enum
  "promptType": "text_prompt",           // [필수] enum
  "prompt": "질문 텍스트",               // [필수] 10-500자 또는 파일경로
  "importance": "high",                  // [필수] enum
  "required": true,                      // [필수] boolean
  "validation": {...},                   // [필수] 타입별 다름
  "options": [...],                      // [조건부] multiple_choice만
  "nextQuestion": "Q2"                   // [필수] string|object|null
}
```

**questionType 허용값**:
- `multiple_choice`: 객관식
- `text_opinion`: 텍스트 의견
- `voice_opinion`: 음성 의견

**promptType 허용값**:
- `text_prompt`: 텍스트 질문
- `voice_prompt`: 음성 질문 (오디오 파일)

**importance 허용값**:
- `critical`: 가중치 100%
- `high`: 가중치 80%
- `medium`: 가중치 60%
- `low`: 가중치 40%

### 7. Validation 구조 (타입별)

#### multiple_choice
```json
{
  "minSelections": 1,     // 최소 선택 개수
  "maxSelections": 1      // 최대 선택 개수
}
```

#### text_opinion
```json
{
  "minLength": 10,        // 최소 글자수
  "maxLength": 1000,      // 최대 글자수
  "pattern": null         // 정규식 (선택)
}
```

#### voice_opinion
```json
{
  "minDuration": 5,       // 최소 녹음 시간 (초)
  "maxDuration": 120      // 최대 녹음 시간 (초)
}
```

### 8. Option 구조 (multiple_choice 전용)

```json
{
  "value": "1",              // [필수] 문자열, 고유
  "label": "20대 이하",      // [필수] 3-50자
  "score": 1,                // [필수] 1-5
  "category": "age"          // [선택] 분석용
}
```

**검증 규칙**:
- value: 같은 질문 내 고유
- label: 화면 표시용 텍스트
- score: 1-5 정수
- 최소 2개, 최대 10개 옵션

### 9. Audio 메타데이터 (voice_prompt)

```json
{
  "format": "mp3",                       // mp3, wav, m4a
  "duration": 15,                        // 초 단위
  "hasTranscript": true,                 // 자막 제공 여부
  "transcript": "서비스를 얼마나..."     // 자막 텍스트
}
```

### 10. Audio 메타데이터 (voice_opinion)

```json
{
  "format": "mp3",
  "duration": 20,
  "maxRecordingTime": 120,               // 최대 녹음 시간
  "hasTranscript": true,
  "transcript": "이유를 말씀해주세요"
}
```

### 11. NextQuestion 패턴 (3가지)

#### 패턴 1: 고정 다음 질문
```json
"nextQuestion": "Q2"
```

#### 패턴 2: 조건부 분기
```json
"nextQuestion": {
  "1": "Q3",
  "2": "Q3",
  "3": "Q3",
  "4": "Q4",
  "5": "Q5"
}
```

#### 패턴 3: 마지막 질문
```json
"nextQuestion": null
```

---

## 🎨 UI/UX 상세 요구사항

### 화면 구성 (9개 화면)

#### 1. 시작 화면
- 설문 제목 및 설명
- 시작 버튼
- 예상 소요시간
- 나중에 하기 옵션

#### 2. 설문 소개 화면
- 조사 기본 정보
- 조사 기간/시간
- 담당 부서
- 설문 구성 (섹션별)

#### 3. 텍스트 프롬프트 질문 (Q1, Q3, Q6)
- 진행도 표시 (■■■□□ 3/7)
- 섹션명
- 질문 텍스트
- 라디오 버튼 / 체크박스
- 필수/선택 표시
- 이전/다음 버튼

#### 4. Likert Scale 질문 (Q3)
- 5단계 척도
- 양극단 라벨
- 시각적 척도 표시

#### 5. 음성 프롬프트 질문 (Q2, Q5, Q7)
- 음성 재생 버튼
- 자막 제공
- 재생시간 표시
- 재생 제어 (재생/중지/음량)
- 선택지 표시

#### 6. 텍스트 의견 수집 (Q4)
- 텍스트 입력 영역
- 글자수 카운터 (0/1000)
- 최소 글자수 안내
- placeholder

#### 7. 음성 녹음 화면 (Q5, Q7)
- 녹음 시작/중지 버튼
- 녹음 시간 표시
- 최대 녹음 시간 안내
- 이전 녹음 재생/삭제
- 언어 선택

#### 8. 복수 선택 질문 (Q6)
- 체크박스
- 선택 개수 표시 (2/3)
- 최대 선택 개수 안내

#### 9. 완료 화면
- 완료 메시지
- 응답 시간 표시
- 섹션별 완료 상태
- 경품 안내 (선택)
- 메인으로/다시하기 버튼

### 디자인 시스템

#### 색상 팔레트
```css
--primary: #0066FF;      /* 파란색 */
--success: #10B981;      /* 초록색 */
--warning: #F59E0B;      /* 주황색 */
--error: #EF4444;        /* 빨간색 */
--neutral: #6B7280;      /* 회색 */
--background: #F9FAFB;   /* 밝은 회색 */
```

#### 타이포그래피
```css
--font-title: 24px Bold;      /* 설문 제목 */
--font-subtitle: 18px Bold;   /* 섹션명 */
--font-body: 16px Regular;    /* 질문 텍스트 */
--font-label: 14px Regular;   /* 선택지 */
--font-helper: 12px Light;    /* 설명/오류 */
```

#### 여백/간격
```css
--padding-card: 24px;
--spacing-element: 16px;
--spacing-section: 32px;
--padding-mobile: 16px;
```

### 반응형 브레이크포인트
```css
--mobile: 0-767px;        /* 스마트폰 */
--tablet: 768px-1023px;   /* 태블릿 */
--desktop: 1024px+;       /* 데스크톱 */
```

---

## 🏗️ 설문 Builder 설계

### Builder 구조

```
SurveyBuilderPage
├─ BuilderHeader (파일명, 저장 상태)
├─ BuilderLayout
│   ├─ QuestionPalette (질문 타입 목록)
│   ├─ CanvasArea (드래그&드롭 영역)
│   └─ PropertyPanel (속성 편집)
└─ BuilderFooter (상태바)
```

### QuestionNode 구조

```
┌──────────────────────────┐
│  ● IncomingConnector     │  ← 상단 연결점
│                          │
│  [Q1] 연령대             │  ← 헤더
│  귀하의 연령대를...      │  ← 바디
│  필수 | 단일선택         │  ← 푸터
│                          │
│  │ OutgoingConnector     │  ← 하단 연결점
└──────────────────────────┘
```

### 상태 관리 구조

```typescript
type BuilderState = {
  surveyMeta: SurveyMeta;
  questionMap: Map<string, QuestionNode>;
  questionGraph: Edge[];
  selectedNodeId: string | null;
  uiState: {
    isDirty: boolean;
    fileName: string;
    zoom: number;
  };
};
```

### Drag & Drop 흐름

```
1. Drag Start
   - PaletteItem 클릭 시작
   - ghostNode 생성

2. Drag Over
   - CanvasArea에서 drop zone 활성화
   - 기존 노드 위치 하이라이트

3. Drop
   - 새 QuestionNode 생성
   - questionMap 업데이트
   - 자동 ID 할당

4. Validation
   - 순환 참조 체크
   - 다중 incoming 방지
```

### Graph → JSON 변환

```typescript
function graphToJSON(graph: BuilderState): Survey {
  // 1. Node 순회
  const questions = Array.from(graph.questionMap.values());
  
  // 2. Edge 기반 nextQuestion 생성
  questions.forEach(q => {
    const edges = graph.questionGraph.filter(e => e.source === q.id);
    q.nextQuestion = buildNextQuestion(edges);
  });
  
  // 3. Section 단위 정렬
  const sections = groupBySection(questions);
  
  return {
    ...graph.surveyMeta,
    sections,
    questions
  };
}
```

---

## ⚠️ 구현 강제 사항

### JSON 스키마 강제 규칙

#### 1. 고유성 (Uniqueness)
```
✅ surveyId: 전체 시스템에서 고유
✅ questionId: 설문 내에서 고유
✅ title: 설문 내에서 고유
✅ sectionId: 설문 내에서 고유
✅ option.value: 질문 내에서 고유
```

#### 2. 참조 무결성 (Referential Integrity)
```
✅ question.sectionId → sections에 존재
✅ section.questionIds → questions에 존재
✅ question.nextQuestion → questions에 존재 또는 null
✅ nextQuestion 객체의 값 → questions에 존재
```

#### 3. 조건부 제약 (Conditional Constraints)
```
✅ maxSelections >= minSelections
✅ maxLength > minLength
✅ maxDuration > minDuration
✅ date.end >= date.start
✅ time.end > time.start
✅ offtime.end > offtime.start
✅ supportedLanguages에 language 포함
```

#### 4. 타입별 필수 필드
```
multiple_choice:
  ✅ options 배열 필수 (2-10개)
  ✅ validation.minSelections 필수
  ✅ validation.maxSelections 필수

text_opinion:
  ✅ validation.minLength 필수
  ✅ validation.maxLength 필수
  ✅ placeholder 권장

voice_opinion:
  ✅ validation.minDuration 필수
  ✅ validation.maxDuration 필수
  ✅ audio 객체 필수 (voice_prompt일 때)
```

### UI/UX 강제 규칙

#### 1. 접근성 (Accessibility)
```
✅ 모든 인터랙티브 요소에 aria-label
✅ 키보드 네비게이션 지원 (Tab, Enter, Space)
✅ 스크린 리더 대응 (role, aria-*)
✅ 명도 대비 4.5:1 이상 (WCAG AA)
✅ 포커스 표시 명확 (outline, box-shadow)
```

#### 2. 반응형 (Responsive)
```
모바일 (< 768px):
  ✅ 한 화면에 하나의 질문
  ✅ 터치 영역 최소 44x44px
  ✅ 폰트 크기 최소 16px
  ✅ 스와이프 제스처 지원

태블릿 (768-1023px):
  ✅ 2컬럼 레이아웃 가능
  ✅ 사이드바 표시
  ✅ 확장된 네비게이션

데스크톱 (>= 1024px):
  ✅ 3컬럼 레이아웃 가능
  ✅ 팝업/모달 활용
  ✅ 확장된 통계 표시
```

#### 3. 성능 (Performance)
```
✅ 초기 로딩 < 3초
✅ 질문 전환 < 300ms
✅ 자동 저장 주기 3초
✅ 음성 파일 < 5MB
✅ 이미지 lazy loading
```

### Builder 강제 규칙

#### 1. 노드 연결 제약
```
✅ 하나의 노드는 하나의 incoming만 허용
✅ 여러 개의 outgoing 허용 (분기)
✅ 순환 참조 금지
✅ 고아 노드 방지 (시작 노드 제외)
```

#### 2. 검증 타이밍
```
✅ 실시간 검증 (속성 변경 시)
✅ 저장 전 전체 검증
✅ 미검증 상태로 저장 불가
✅ 경고는 허용, 에러는 차단
```

---

## ✅ 검증 패턴

### 1. JSON 스키마 검증

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// 필수 필드 검증
function validateRequiredFields(survey: Survey): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 최상위 필수 필드
  const required = [
    'surveyId', 'version', 'title', 'description',
    'language', 'supportedLanguages', 'creator',
    'schedule', 'settings', 'sections', 'questions'
  ];
  
  required.forEach(field => {
    if (!survey[field]) {
      errors.push({
        field,
        message: `필수 필드 ${field}가 누락되었습니다.`
      });
    }
  });
  
  return { isValid: errors.length === 0, errors, warnings: [] };
}

// 고유성 검증
function validateUniqueness(survey: Survey): ValidationResult {
  const errors: ValidationError[] = [];
  
  // questionId 고유성
  const questionIds = survey.questions.map(q => q.questionId);
  const duplicateIds = findDuplicates(questionIds);
  if (duplicateIds.length > 0) {
    errors.push({
      field: 'questions.questionId',
      message: `중복된 questionId: ${duplicateIds.join(', ')}`
    });
  }
  
  // title 고유성
  const titles = survey.questions.map(q => q.title);
  const duplicateTitles = findDuplicates(titles);
  if (duplicateTitles.length > 0) {
    errors.push({
      field: 'questions.title',
      message: `중복된 title: ${duplicateTitles.join(', ')}`
    });
  }
  
  return { isValid: errors.length === 0, errors, warnings: [] };
}

// 참조 무결성 검증
function validateReferences(survey: Survey): ValidationResult {
  const errors: ValidationError[] = [];
  const questionIds = new Set(survey.questions.map(q => q.questionId));
  const sectionIds = new Set(survey.sections.map(s => s.sectionId));
  
  survey.questions.forEach(q => {
    // sectionId 참조 검증
    if (!sectionIds.has(q.sectionId)) {
      errors.push({
        field: `questions.${q.questionId}.sectionId`,
        message: `존재하지 않는 sectionId: ${q.sectionId}`
      });
    }
    
    // nextQuestion 참조 검증
    if (typeof q.nextQuestion === 'string' && q.nextQuestion !== null) {
      if (!questionIds.has(q.nextQuestion)) {
        errors.push({
          field: `questions.${q.questionId}.nextQuestion`,
          message: `존재하지 않는 questionId: ${q.nextQuestion}`
        });
      }
    }
  });
  
  return { isValid: errors.length === 0, errors, warnings: [] };
}
```

### 2. UI 컴포넌트 검증

```typescript
// 필수 props 검증
function validateQuestionComponent(props: QuestionProps): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!props.questionId) errors.push({ field: 'questionId', message: '필수' });
  if (!props.title) errors.push({ field: 'title', message: '필수' });
  if (!props.prompt) errors.push({ field: 'prompt', message: '필수' });
  
  return { isValid: errors.length === 0, errors, warnings: [] };
}

// 접근성 검증
function validateAccessibility(element: HTMLElement): ValidationResult {
  const warnings: ValidationWarning[] = [];
  
  // aria-label 검증
  const interactive = element.querySelectorAll('button, a, input');
  interactive.forEach(el => {
    if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
      warnings.push({
        element: el,
        message: 'aria-label이 누락되었습니다.'
      });
    }
  });
  
  return { isValid: true, errors: [], warnings };
}
```

### 3. Builder 검증

```typescript
// 그래프 순환 참조 검증
function validateNoCircularReferences(graph: BuilderState): ValidationResult {
  const errors: ValidationError[] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  
  function dfs(nodeId: string): boolean {
    if (stack.has(nodeId)) return true; // 순환 발견
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    stack.add(nodeId);
    
    const edges = graph.questionGraph.filter(e => e.source === nodeId);
    for (const edge of edges) {
      if (dfs(edge.target)) return true;
    }
    
    stack.delete(nodeId);
    return false;
  }
  
  for (const [nodeId] of graph.questionMap) {
    if (dfs(nodeId)) {
      errors.push({
        field: `graph.${nodeId}`,
        message: '순환 참조가 감지되었습니다.'
      });
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings: [] };
}
```

---

## 🤖 AI 도구 전달 가이드

### 프롬프트 템플릿

```markdown
다음 명세서를 기반으로 고객만족도 조사 시스템을 구현해주세요.

## 1. 시스템 개요
[20251223_v1_summary_cursorai.md의 "시스템 핵심 요구사항" 섹션 붙여넣기]

## 2. JSON 스키마
[20251223_v1_plan.md 전체 또는 핵심 부분 붙여넣기]

## 3. UI/UX 요구사항
[20251223_v1_desc.md의 화면 구성 부분 붙여넣기]

## 4. Builder 설계
[20251223_v1_survey_builder_design.md의 핵심 부분 붙여넣기]

## 5. 구현 요구사항
- 모든 강제 규칙 준수
- 검증 패턴 구현
- 테스트 코드 작성
- 문서화 포함

## 6. 검증 항목
- JSON 스키마 준수도 100%
- UI/UX 요구사항 준수도 100%
- 접근성 WCAG AA 준수
- 반응형 디자인 완전 구현

생성 후 다음을 제공해주세요:
1. 전체 소스 코드
2. 실행 방법 (README)
3. 테스트 결과
4. 검증 체크리스트
```

### 단계별 전달 전략

#### Phase 1: JSON 스키마 구현
```
입력: 20251223_v1_plan.md
출력: TypeScript 인터페이스 + 검증 로직
검증: JSON 샘플 로드 테스트
```

#### Phase 2: UI 컴포넌트 구현
```
입력: 20251223_v1_desc.md
출력: React 컴포넌트 + Storybook
검증: 9개 화면 렌더링 테스트
```

#### Phase 3: Builder 구현
```
입력: 20251223_v1_survey_builder_design.md
출력: Builder UI + 상태 관리
검증: 드래그&드롭 + Graph → JSON 변환 테스트
```

#### Phase 4: 통합 및 검증
```
입력: 20251223_v1_summary_cursorai.md (this file)
출력: 통합 시스템
검증: 전체 체크리스트
```

---

## 📋 교차 검증 체크리스트

### A. JSON 스키마 검증 (100점 만점)

```
□ 최상위 필드 (11개) - 22점
  □ surveyId 형식 검증 (2점)
  □ version 형식 검증 (2점)
  □ title 길이 검증 (2점)
  □ description 길이 검증 (2점)
  □ language ISO 639-1 (2점)
  □ supportedLanguages 배열 (2점)
  □ creator 구조 (2점)
  □ schedule 구조 (2점)
  □ settings 구조 (2점)
  □ sections 배열 (2점)
  □ questions 배열 (2점)

□ Section 필드 (5개) - 10점
  □ sectionId 고유성 (2점)
  □ title 길이 (2점)
  □ description 길이 (2점)
  □ questionIds 참조 (2점)
  □ required 타입 (2점)

□ Question 필드 (11개) - 22점
  □ questionId 고유성 (2점)
  □ title 고유성 (2점)
  □ sectionId 참조 (2점)
  □ questionType enum (2점)
  □ promptType enum (2점)
  □ prompt 검증 (2점)
  □ importance enum (2점)
  □ required 타입 (2점)
  □ validation 구조 (2점)
  □ options 배열 (2점)
  □ nextQuestion 참조 (2점)

□ 검증 규칙 - 23점
  □ 고유성 검증 (5점)
  □ 참조 무결성 (5점)
  □ 조건부 제약 (5점)
  □ 타입별 필수 필드 (5점)
  □ 범위 검증 (3점)

□ 분기 로직 - 23점
  □ 고정 nextQuestion (8점)
  □ 조건부 분기 (8점)
  □ null 처리 (7점)
```

### B. UI/UX 검증 (100점 만점)

```
□ 화면 구성 (9개) - 45점
  □ 시작 화면 (5점)
  □ 설문 소개 (5점)
  □ 텍스트 프롬프트 (5점)
  □ Likert Scale (5점)
  □ 음성 프롬프트 (5점)
  □ 텍스트 의견 (5점)
  □ 음성 녹음 (5점)
  □ 복수 선택 (5점)
  □ 완료 화면 (5점)

□ 디자인 시스템 - 20점
  □ 색상 팔레트 (5점)
  □ 타이포그래피 (5점)
  □ 여백/간격 (5점)
  □ 일관성 (5점)

□ 반응형 - 20점
  □ 모바일 (7점)
  □ 태블릿 (7점)
  □ 데스크톱 (6점)

□ 접근성 - 15점
  □ aria-label (5점)
  □ 키보드 네비게이션 (5점)
  □ 명도 대비 (5점)
```

### C. Builder 검증 (100점 만점)

```
□ Builder 구조 - 30점
  □ Header (10점)
  □ Palette (10점)
  □ Canvas (10점)

□ QuestionNode - 25점
  □ 노드 구조 (10점)
  □ Connector (10점)
  □ 상태 관리 (5점)

□ Drag & Drop - 25점
  □ Drag Start (8점)
  □ Drag Over (8점)
  □ Drop (9점)

□ Graph → JSON - 20점
  □ 변환 로직 (10점)
  □ 검증 (10점)
```

### D. 통합 검증 (100점 만점)

```
□ 기능 완전성 - 40점
  □ 설문 CRUD (10점)
  □ 동적 분기 (10점)
  □ 음성 처리 (10점)
  □ 자동 저장 (10점)

□ 성능 - 20점
  □ 초기 로딩 < 3초 (7점)
  □ 질문 전환 < 300ms (7점)
  □ 자동 저장 반응성 (6점)

□ 코드 품질 - 20점
  □ TypeScript 타입 정의 (5점)
  □ 테스트 커버리지 > 80% (5점)
  □ ESLint 0 에러 (5점)
  □ 문서화 (5점)

□ 사용자 경험 - 20점
  □ 직관성 (10점)
  □ 오류 처리 (10점)
```

---

## 📊 최종 평가 기준

### 합격 기준
```
A. JSON 스키마: >= 90점
B. UI/UX: >= 85점
C. Builder: >= 85점
D. 통합: >= 90점

전체 평균: >= 90점
```

### 등급
```
S급: 95점 이상 - 즉시 프로덕션 투입 가능
A급: 90-94점 - 마이너 수정 후 투입 가능
B급: 85-89점 - 주요 수정 필요
C급: 80-84점 - 재작업 필요
F급: 80점 미만 - 재설계 필요
```

---

## 🎯 성공 기준

### 필수 달성 목표
```
✅ 모든 강제 규칙 100% 준수
✅ 검증 체크리스트 90% 이상 통과
✅ JSON 샘플 로드 및 실행 성공
✅ 9개 화면 완전 구현
✅ Builder 기본 기능 동작
✅ 접근성 WCAG AA 준수
✅ 반응형 3가지 모드 완벽 동작
```

### 권장 달성 목표
```
⭐ 테스트 커버리지 > 80%
⭐ 성능 목표 100% 달성
⭐ 문서화 완료
⭐ Storybook 구축
⭐ E2E 테스트 구현
```

---

## 📚 참고 문서

### 핵심 문서
```
1. 20251223_v1_css.json - JSON 데이터 샘플
2. 20251223_v1_desc.md - UI/UX 화면 설계
3. 20251223_v1_plan.md - JSON 스키마 설계서
4. 20251223_v1_survey_builder_design.md - Builder 설계
5. 20251223_v1_SUMMARY.md - 프로젝트 요약
```

### 추가 자료
```
- WCAG 2.1 AA 가이드라인
- React Flow 공식 문서
- TypeScript 공식 문서
- Tailwind CSS 공식 문서
```

---

## ⚡ 빠른 시작 가이드

### 1단계: 문서 이해
```
1. 이 문서(20251223_v1_summary_cursorai.md) 정독
2. JSON 샘플(20251223_v1_css.json) 로드 테스트
3. 화면 설계(20251223_v1_desc.md) 이미지화
```

### 2단계: 환경 설정
```bash
# 프로젝트 생성
npx create-next-app@latest css-survey-system --typescript --tailwind

# 의존성 설치
npm install zustand react-flow-renderer axios zod

# 개발 서버 시작
npm run dev
```

### 3단계: 구현 순서
```
1. TypeScript 인터페이스 정의
2. JSON 검증 로직 구현
3. 기본 컴포넌트 구현 (Question, Option)
4. 9개 화면 구현
5. Builder UI 구현
6. 통합 및 테스트
```

---

## 🔚 최종 확인 사항

### AI 도구에 전달 전 체크
```
□ 4개 핵심 문서 준비 완료
□ 이 summary 문서 정독 완료
□ 구현 강제 사항 이해 완료
□ 검증 체크리스트 확인 완료
□ 프롬프트 템플릿 준비 완료
```

### AI 도구 응답 확인사항
```
□ 전체 소스 코드 제공
□ 실행 가능한 상태
□ README 포함
□ 테스트 코드 포함
□ 검증 결과 제공
```

---

**문서 버전**: v1.0  
**최종 작성일**: 2024-12-23  
**상태**: ✅ AI 구축용 최종 확정  
**다음 단계**: AI 도구에 전달 → 구현 → 검증 → 배포

**이 문서는 고객만족도 조사 시스템 구축을 위한 완전한 명세서입니다.** 🚀

