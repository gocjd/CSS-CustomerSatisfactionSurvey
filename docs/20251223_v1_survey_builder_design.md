# 고객만족도 조사 시스템 – 설문지 Builder 통합 설계 문서

> 본 문서는 지금까지 GPT가 설명한 모든 설계 내용을 정리·문서화하고,
> 이어서 향후 단계별 확장 설계를 순차적으로 정의한 **단일 기준 문서(Single Source of Truth)** 이다.

---

## 1. 목적과 배경

본 설문지 Builder는 비개발자도 쉽게 설문지를 구성할 수 있으면서,
내부적으로는 **명확한 JSON / CSS 구조**를 유지하는 것을 목표로 한다.

핵심 요구사항은 다음과 같다.

- 설문 생성 방식의 다양성
  - 신규 설문
  - 템플릿 기반 설문
  - 기존 설문 수정 / 복사 / 다른 이름으로 저장
- 질문(Question)의 자유로운 추가·삭제·수정
- Drag & Drop 기반 시각적 설문 흐름(Graph) 구성
- 질문 간 연결(분기 로직)을 직관적으로 표현
- CSS/스타일 구조를 사용자가 인지하지 않아도 일관되게 생성

---

## 2. 설문 생성 진입 흐름 (Entry Flow)

### 2.1 설문 생성 방식

사용자는 설문지 생성 시 다음 세 가지 방식 중 하나를 선택할 수 있다.

1. **템플릿 선택**
   - 제품에서 제공하는 기본 템플릿
   - 사용자가 이전에 만든 설문을 템플릿으로 등록한 것

2. **이전 설문 불러오기**
   - 수정
   - 복사 후 수정
   - 다른 이름으로 저장

3. **신규 설문 생성**
   - 완전히 빈 상태의 설문
   - 파일명 기본값: `untitled`

---

## 3. Builder UI 전체 구조

### 3.1 Page 레벨 구성

```
SurveyCreatePage
 ├─ SurveyEntrySelector
 │   ├─ TemplateGallery
 │   ├─ SurveyHistoryList
 │   └─ NewSurveyButton
 │
 └─ SurveyBuilderPage
     ├─ BuilderHeader
     ├─ BuilderLayout
     │   ├─ QuestionPalette
     │   ├─ CanvasArea
     │   └─ PropertyPanel
     └─ BuilderFooter
```

---

## 4. Builder Header & 메타 정보

### 4.1 BuilderHeader

**역할**
- 설문 파일명 관리
- 저장 상태 표시
- 저장 / 다른 이름으로 저장

**주요 UX 포인트**
- 신규 설문 진입 시 파일명은 `untitled`
- 수정 발생 시 Dirty 상태 표시

---

## 5. Question Palette (질문 추가 영역)

### 5.1 QuestionPalette

**역할**
- Drag & Drop 으로 질문을 추가하기 위한 질문 템플릿 제공

**기본 제공 질문 타입**
- 객관식 (단일 / 복수)
- 텍스트 의견
- 음성 의견
- Likert Scale

---

## 6. Canvas 영역 (핵심 Builder 영역)

### 6.1 CanvasArea

**역할**
- 질문 노드를 시각적으로 배치
- 질문 간 연결(Flow) 표시

**기능**
- Drag & Drop Drop Target
- 질문 노드 선택
- Context Menu 관리

---

## 7. QuestionNode 설계

### 7.1 QuestionNode 기본 구조

```
┌──────────────────────────┐
│  ● Incoming Connector    │  ← 상단 연결 포인트
│                          │
│  Question Content        │
│                          │
│  │                       │
│  │  Outgoing Connector   │  ← 하단 약 1cm 직선 포인트
│  │_______________________│
```

### 7.2 Connector 설계

- **IncomingConnector**
  - 이전 질문에서 연결되는 포인트
  - 단일 연결 허용

- **OutgoingConnector**
  - 다음 질문으로 연결되는 포인트
  - 약 1cm 길이의 직선 형태
  - Drag 시작점 역할

---

## 8. 질문 추가 / 삭제 / 수정 UX

### 8.1 Drag & Drop 추가

- QuestionPalette → CanvasArea 로 Drag
- Drop 위치에 새로운 QuestionNode 생성

### 8.2 Context Menu (우클릭)

**기능**
- 질문 추가 (위 / 아래)
- 질문 삭제
- 질문 복제

---

## 9. Property Panel (속성 편집)

### 9.1 PropertyPanel

**역할**
- 선택된 QuestionNode의 속성 편집

### 9.2 QuestionPropertyEditor

**탭 구성**
- 기본 정보
- 옵션
- 검증 규칙
- 분기 로직
- 스타일 (CSS Builder 연계)

---

## 10. 상태 관리 개요

### 10.1 핵심 상태 구조

```
surveyMeta
questionMap
questionGraph (edges)
selectedNodeId
uiState
```

### 10.2 QuestionNode 데이터 모델

```ts
type QuestionNode = {
  id: string
  type: QuestionType
  position: { x: number; y: number }
  next?: BranchRule
}
```

---

# 11. 다음 단계 설계 (확장 단계)

이 장부터는 **Builder 완성을 위한 단계별 확장 설계**이다.

---

## 11-1. QuestionNode 상세 UI Wireframe 설계

### 목표
- 질문 타입별 시각적 차별화
- 한 눈에 질문 성격을 파악 가능

### 설계 포인트
- Question Header: 질문 번호 / 타입 아이콘
- Question Body: 프롬프트 요약 표시
- Question Footer: 필수 여부 / 분기 여부 표시

---

## 11-2. Drag & Drop 이벤트 흐름 설계

### 단계

1. Drag Start
   - PaletteItem 또는 OutgoingConnector
2. Drag Over
   - CanvasArea 또는 IncomingConnector Highlight
3. Drop
   - 질문 생성 또는 연결 생성
4. Validation
   - 순환 참조 방지
   - 다중 Incoming 방지

---

## 11-3. Graph → JSON 변환 로직 설계

### 목표
- Canvas의 시각적 Flow를 JSON Schema로 변환

### 핵심 매핑

| Graph 요소 | JSON 필드 |
|----------|-----------|
| Node | question |
| Edge | nextQuestion |
| Branch Edge | nextQuestion 객체 |

### 처리 순서
1. Node 순회
2. Edge 기반 nextQuestion 생성
3. Section 단위 정렬

---

## 11-4. CSS Builder 연계 설계

### 원칙
- 사용자는 CSS를 직접 작성하지 않음
- 의미 기반 UI → css.json 자동 생성

### Builder 연계 방식
- PropertyPanel 내 Style 탭
- Scope 기반 스타일 적용
  - Survey / Section / Question / Option

---

## 11-5. React Flow / D3 / Custom Canvas 비교

| 항목 | React Flow | D3 | Custom |
|----|----|----|----|
| 구현 난이도 | 낮음 | 높음 | 중간 |
| 분기 표현 | 우수 | 매우 우수 | 구현 필요 |
| 유지보수 | 쉬움 | 어려움 | 설계 의존 |

**권장**: v1은 React Flow 기반

---

# 11-6. Question 타입별 JSON Schema + UI 매핑 표

본 장은 **Question 타입별로 JSON Schema와 Builder UI 요소가 어떻게 1:1로 매핑되는지**를 정의한다.
이 표는 **개발, 기획, QA, AI 자동 생성(MCP)** 모두의 기준 문서로 사용된다.

---

## 공통 Question 기본 Schema

모든 Question 타입은 다음 공통 필드를 가진다.

```json
{
  "questionId": "Q1",
  "sectionId": "SEC1",
  "title": "연령대",
  "importance": "high",
  "required": true,
  "nextQuestion": "Q2"
}
```

| JSON 필드 | UI 위치 | 설명 |
|---------|--------|------|
| questionId | 자동 생성 | Builder 내부 고유 ID |
| sectionId | 숨김 | 섹션 연결용 |
| title | 질문 헤더 | 질문 요약 제목 |
| importance | 속성 패널 | 분석 가중치 |
| required | 질문 헤더 | 필수 여부 토글 |
| nextQuestion | 분기 설정 | 다음 질문 연결 |

---

## 1. multiple_choice (객관식)

### JSON Schema

```json
{
  "questionType": "multiple_choice",
  "promptType": "text_prompt",
  "prompt": "귀하의 연령대를 선택해 주세요.",
  "validation": {
    "minSelections": 1,
    "maxSelections": 1
  },
  "options": [
    { "value": "1", "label": "20대 이하", "score": 1 }
  ]
}
```

### UI 매핑 표

| JSON 필드 | Builder UI | 설명 |
|----------|------------|------|
| prompt | Question Body | 질문 문구 |
| minSelections | Validation 탭 | 최소 선택 개수 |
| maxSelections | Validation 탭 | 최대 선택 개수 |
| options | Option Editor | 선택지 목록 |
| value | 숨김 | 내부 식별값 |
| label | 옵션 입력 | 화면 표시 텍스트 |
| score | 고급 옵션 | 분석 점수 |

---

## 2. multiple_choice + likert_scale

### JSON Schema

```json
{
  "questionType": "multiple_choice",
  "displayType": "likert_scale",
  "options": [
    { "value": "5", "label": "매우 만족", "score": 5 }
  ]
}
```

### UI 매핑 표

| 항목 | UI 표현 |
|----|--------|
| displayType | Likert 전용 레이아웃 |
| options 순서 | 좌 → 우 척도 |
| label | 척도 라벨 |

---

## 3. text_opinion (텍스트 의견)

### JSON Schema

```json
{
  "questionType": "text_opinion",
  "promptType": "text_prompt",
  "validation": {
    "minLength": 10,
    "maxLength": 1000
  },
  "placeholder": "최소 10자 이상 입력해주세요."
}
```

### UI 매핑 표

| JSON 필드 | Builder UI | 설명 |
|---------|------------|------|
| minLength | Validation 탭 | 최소 글자수 |
| maxLength | Validation 탭 | 최대 글자수 |
| placeholder | 입력창 | 가이드 문구 |

---

## 4. voice_opinion (음성 의견)

### JSON Schema

```json
{
  "questionType": "voice_opinion",
  "promptType": "voice_prompt",
  "audio": {
    "format": "mp3",
    "maxRecordingTime": 120,
    "hasTranscript": true
  },
  "validation": {
    "minDuration": 5,
    "maxDuration": 120
  }
}
```

### UI 매핑 표

| JSON 필드 | Builder UI | 설명 |
|---------|------------|------|
| maxRecordingTime | 녹음 설정 | 최대 녹음 시간 |
| hasTranscript | 접근성 옵션 | 자막 제공 여부 |
| minDuration | Validation 탭 | 최소 녹음 시간 |
| maxDuration | Validation 탭 | 최대 녹음 시간 |

---

## 5. voice_prompt (음성 질문)

### JSON Schema

```json
{
  "promptType": "voice_prompt",
  "audio": {
    "format": "mp3",
    "duration": 15,
    "transcript": "질문 음성 자막"
  }
}
```

### UI 매핑 표

| JSON 필드 | Builder UI | 설명 |
|---------|------------|------|
| audio 파일 | 업로드 | 질문 음성 |
| duration | 자동 계산 | 음성 길이 |
| transcript | 텍스트 입력 | 자막 |

---

## 6. 분기 로직 (Branching)

### JSON Schema

```json
"nextQuestion": {
  "1": "Q3",
  "2": "Q4"
}
```

### UI 매핑 표

| JSON 구조 | Builder UI |
|---------|-------------|
| key(value) | 옵션별 연결선 |
| value(Qx) | 연결 대상 노드 |

---

## 7. 요약 매핑 매트릭스

| Question Type | Prompt | Option | Validation | Audio | Branch |
|--------------|--------|--------|------------|-------|--------|
| multiple_choice | ✅ | ✅ | ✅ | ❌ | ✅ |
| likert_scale | ✅ | ✅ | 제한 | ❌ | ✅ |
| text_opinion | ✅ | ❌ | ✅ | ❌ | ✅ |
| voice_opinion | 음성 | ❌ | ✅ | ✅ | ✅ |

---

## 12. 최종 결론

> **JSON Schema는 진실의 원천(Source of Truth)** 이며,
> Builder UI는 이를 사람이 이해할 수 있는 형태로 번역하는 도구이다.

이 매핑 표를 기준으로:
- UI 변경 ≠ JSON 구조 붕괴
- AI 생성 설문 ≠ Builder 호환성 문제

를 동시에 만족시킬 수 있다.

---

(끝)

