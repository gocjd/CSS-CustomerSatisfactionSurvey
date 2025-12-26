# 고객만족도 조사 시스템 (CSS) - Antigravity 설문 빌더 통합 설계
## Antigravity's Architecture & Design Summary

**작성일**: 2024년 12월 25일  
**작성자**: Antigravity  
**기반 문서**: 20251223_v1_css.json, 20251223_v1_plan.md, 20251223_v1_survey_builder_design.md 외 2건  
**목표**: Cursor AI가 제시한 기초 설계를 바탕으로, **Google Opal 및 Vertex AI 스타일의 "노드 기반 시각적 빌더(Visual Node Builder)"** 를 중심으로 한 최상의 시스템 아키텍처 제안.

---

## 1. 🏗️ 시스템 아키텍처 개요 (System Architecture)

Antigravity는 본 시스템을 **"데이터 중심(Data-Centric)"** 과 **"시각적 저작(Visual Authoring)"** 두 가지 핵심 축으로 정의합니다. 사용자는 복잡한 JSON 스키마를 직접 다루지 않고, 직관적인 노드 그래프를 통해 로직을 설계하며, 시스템은 이를 완벽한 `css.json`으로 변환합니다.

### 1-1. 기술 스택 (Recommended Stack)

최상의 성능과 유지보수성을 위한 기술 스택을 제안합니다.

*   **Core Framework**: **Next.js 14+ (App Router)**
    *   이유: 서버 사이드 렌더링(SSR)을 통한 빠른 초기 로딩 및 SEO 최적화, API Routes를 통한 백엔드 통합 용이성.
*   **Visual Logic Engine**: **React Flow 12+** (또는 XYFlow)
    *   이유: "Google Opal" 스타일의 노드 연결을 가장 유연하게 구현 가능. 커스텀 노드, 줌/팬, 미니맵, 포트 제어 등 강력한 기능 제공.
*   **State Management**: **Zustand** + **Immer**
    *   이유: 복잡한 그래프 상태(노드, 엣지, 메타데이터)를 불변성을 유지하며 관리하기 위함. Redux보다 가볍고 보일러플레이트가 적음.
*   **Schema Validation**: **Zod**
    *   이유: `plan.md`에 정의된 엄격한 규칙을 런타임에서 검증. TypeScript 타입 추론과 자동 연동.
*   **Styling**: **Tailwind CSS** + **Shadcn/UI**
    *   이유: 빠르고 일관된 디자인 시스템 구축. "Premium Design" 요구사항 충족 용이.

---

## 2. 🎨 "Google Opal" 스타일 빌더 UX/UI 설계

사용자가 요청한 **"앞뒤 노드간의 연결(Front-to-Back Node Connection)"** 은 데이터의 흐름이 왼쪽에서 오른쪽으로(Left-to-Right) 또는 위에서 아래로(Top-to-Bottom) 자연스럽게 흐르는 **DAG(Directed Acyclic Graph)** 형태를 의미합니다.

### 2-1. Canvas & Node 메타포

*   **배경 (Canvas)**: 무한히 확장 가능한 그리드 캔버스 (Dot Pattern).
*   **노드 (Node)**: 각 "질문(Question)"은 하나의 카드 형태 노드로 표현됩니다.
*   **연결선 (Edge)**: 질문의 흐름(Flow)을 나타내는 곡선(Bezier Curve).
    *   **애니메이션**: 활성화된 경로를 따라 흐르는 입자 애니메이션으로 데이터 흐름 시각화.

### 2-2. Node 구조 상세 (The "Card" Interface)

Google Opal 처럼 깔끔하고 정보 밀도가 높은 노드 디자인을 제안합니다.

```
┌────────────────────────────────────────────────────────┐
│  [Input Port] ●                                        │ <--- Incoming Connection (Previous Question)
│                                                        │
│  ┌────── Header ────────────────────────────────────┐  │
│  │ ICQN (아이콘)  Q1. 연령대 (ID)           [설정 ⚙️] │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────── Body ──────────────────────────────────────┐  │
│  │ "귀하의 연령대를 선택해 주세요." (Prompt 미리보기)   │  │
│  │                                                  │  │
│  │ [Type: 객관식 단일] [필수 여부: Y]                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────── Output Ports (Branching Logic) ────────────┐  │
│  │                                                  │  │
│  │  [ Default ] ──────────────────────────────●     │  │ <--- Default Route (일반 연결)
│  │                                                  │  │
│  │  [ "20대" ] ───────────────────────────────●     │  │ <--- Branch Route (조건부 분기)
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

#### 📌 핵심 디자인 포인트 (Antigravity's Touch)

1.  **포트 분리 (Port Separation)**:
    *   **Input Port (Left)**: 모든 노드는 왼쪽 중앙에 *단 하나*의 입력 포트를 가집니다.
    *   **Output Ports (Right)**: 오른쪽에는 질문의 유형에 따라 *여러 개*의 출력 포트가 생성됩니다.
        *   **단순 연결**: 1개의 "Next" 포트.
        *   **조건부 분기**: 선택지 답변(Option) 개수만큼 포트가 동적으로 생성되어, 시각적으로 분기 로직을 명확히 보여줍니다. (예: "만족" 선택 시 -> Q5로 연결, "불만족" 선택 시 -> Q4로 연결)

2.  **직관적인 편집 (Visual Editing)**:
    *   노드를 클릭하면 우측 사이드바(Inspector Panel)가 열리며 상세 속성을 편집합니다.
    *   편집 내용은 노드 미리보기에 즉시 반영됩니다.

3.  **오류 시각화 (Error Visualization)**:
    *   연결되지 않은 포트(Dangling Port)나 설정이 누락된 노드는 붉은색 테두리 또는 경고 아이콘으로 강조됩니다.

---

## 3. 🧩 데이터 무결성 및 변환 로직 (Graph <-> JSON)

화면상의 그래프(Graph)와 실제 데이터(JSON) 간의 완벽한 동기화가 필수적입니다.

### 3-1. 양방향 변환 (Bi-directional Mapping)

1.  **Parsing (JSON -> Graph)**:
    *   기존 `css.json` 파일을 불러올 때, `sections`와 `questions` 배열을 순회하며 노드를 생성합니다.
    *   `nextQuestion` 필드를 분석하여 노드 간의 엣지(Edge)를 자동 연결합니다.
    *   *Auto Layout*: 불러온 노드들이 겹치지 않도록 Dagre 또는 Elk.js 알고리즘을 사용해 자동으로 정렬합니다.

2.  **Serialization (Graph -> JSON)**:
    *   저장 시점에는 그래프의 현재 상태를 `plan.md`의 스키마에 맞춰 JSON으로 변환합니다.
    *   이 과정에서 **'유효성 검사(Validation)'** 프로세스가 수행됩니다.

### 3-2. 실시간 검증 시스템 (Real-time Validation)

`plan.md`에 정의된 제약 조건을 Builder가 실시간으로 감시합니다.

*   **Loop Detection**: 사용자가 순환(Loop)되는 연결을 시도하면 즉시 경고하고 연결을 차단하거나 붉은색 엣지로 표시합니다.
*   **Completeness**: 모든 필수 항목(타이틀, 필수 옵션 등)이 작성되었는지 확인합니다.
*   **Orphan Check**: 시작 노드(Start Node)에서 도달할 수 없는 고립된 노드(Orphan Node)를 감지합니다.

---

## 4. 🚀 개발 로드맵 (Implementation Roadmap)

Antigravity가 제안하는 단계별 구현 계획입니다.

### Phase 1: Core Engine & Visuals (2주)
*   프로젝트 세팅 (Next.js, Tailwind, Zustand).
*   React Flow 도입 및 기본 노드(Question Node) 컴포넌트 개발.
*   Canvas 드래그 앤 드롭, 줌/팬 기능 구현.
*   **핵심**: "Google Opal" 스타일의 Node 디자인 테마 적용.

### Phase 2: Logic & Branching (1.5주)
*   포트(Port) 동적 생성 로직 구현 (답변 옵션에 따른 포트 생성).
*   엣지(Edge) 연결 및 삭제 기능.
*   조건부 분기(Branching) 데이터 처리 로직 구현.

### Phase 3: Property Editor & Schema Sync (1.5주)
*   우측 속성 편집 패널(Inspector) 개발.
*   Zod 스키마 기반 폼 유효성 검증.
*   Graph <-> JSON 양방향 변환 모듈 구현.

### Phase 4: Polish & Export (1주)
*   `css.json` 내보내기/불러오기 기능.
*   자동 레이아웃(Auto Layout) 버튼.
*   전체 테스트 및 UI 폴리싱 (애니메이션, 툴팁 등).

---

## 5. 결론 (Conclusion)

기존 설계(Cursor AI)는 데이터 구조와 기능적 요구사항을 완벽하게 정의했습니다. Antigravity는 여기에 **"사용자 경험(UX)의 정점"** 을 더하고자 합니다.

Google Opal 스타일의 **노드 기반 비주얼 빌더**는 복잡한 설문 로직을 한눈에 파악하게 해주며, 실수 없는 설문 설계를 가능하게 할 것입니다. 이 설계안은 시스템의 **안정성(Schema Validation)** 과 **사용성(Visual Builder)** 을 동시에 잡는 최상의 솔루션입니다.

---
**[첨부]**: 본 문서는 `20251223_v1_plan.md`의 JSON 스키마를 엄격히 준수하며 생성되었습니다.
