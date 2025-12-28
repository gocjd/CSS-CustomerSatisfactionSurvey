# 고객만족도 조사 시스템 (CSS) - 개발 이력 및 현황 (DevOps Summary)

## Document Information
- **작성일**: 2025-12-26
- **작성자**: Antigravity (DevOps & Implementation Lead)
- **근거 문서**: 
  - `@[docs/20251225_v1_summary_antigravity.md]` (Architecture)
  - `@[docs/20251225_v1_summary_claude.md]` (Detailed Design)

---

## 1. 개요 (Overview)

본 문서는 초기 설계 문서를 바탕으로 진행된 **실제 개발 과정, 주요 의사결정, 코드 레벨의 수정 사항**을 상세히 기록합니다. 초기 설계의 비전("Google Opal 스타일의 시각적 빌더")을 유지하면서, 사용자 피드백과 기술적 난제를 해결하며 시스템을 고도화했습니다.

---

## 2. 핵심 구현 및 수정 이력 (Key Implementations & Modifications)

### 2-1. 노드 그래프 & 연결성 고도화 (Graph UX)

초기 설계의 단순 연결을 넘어, 픽셀 단위의 정교함과 사용 편의성을 모두 확보했습니다.

#### A. 정밀 연결 시스템 (Precision Connection)
- **문제**: 드래그하기 쉽도록 포트(Handle) 크기를 키웠더니, 연결 선이 노드 중심이 아닌 허공에서 시작되는 것처럼 보이는 시각적 불일치 발생.
- **해결 (The `::after` Technique)**:
  - 실제 React Flow `Handle`은 `w-4 h-4`로 작게 유지하여 **선이 노드 경계 라인 중앙에서 정확히 시작**되도록 보정.
  - CSS `::after` 의사 요소(Pseudo-element)를 사용하여 핸들 주변에 **보이지 않는 거대한 클릭 영역(Hit Area)** 을 생성.
  - **결과**: 사용자는 대충 드래그해도 연결되지만, 시각적으로는 완벽하게 중심점끼리 연결되는 UX 달성.

#### B. 노드 로직 방어 (Node Logic constraints)
- **End Node 발신 차단**: 종료 노드에서 다른 노드로 선을 그을 수 없도록 `Handle` 컴포넌트에 `isConnectableStart={false}` 속성을 명시적으로 적용.
- **순환 참조 방지**: `CanvasArea`의 `onConnect` 핸들러에 **BFS(너비 우선 탐색) 기반 사이클 탐지 로직**을 탑재하여 루프 생성을 원천 차단.

#### C. 고립 노드(Orphan) 검출 로직 개선
- **기존**: Start 노드와 연결되지 않은 모든 '섬(Island)'의 노드를 에러로 표시하여 화면이 빨갛게 도배됨.
- **개선**: 섬의 **진입점(Entry Point)**, 즉 '나가는 선은 있지만 들어오는 선이 없는 노드'만 식별하여 에러를 표시. 노이즈를 획기적으로 줄이고 수정해야 할 지점을 명확히 안내.

---

### 2-2. 미니맵(MiniMap) 시스템 대수술 (Major Overhaul)

단순 네비게이션 용도였던 미니맵을 **"제2의 작업 공간"** 수준으로 격상시켰습니다.

#### A. 렌더링 엔진 수정 (Fixing Rendering Issues)
- **증상**: 미니맵 내 노드가 보이지 않거나 위치가 엇나가는 현상.
- **원인**: 커스텀 노드(`MiniMapNode`)가 React Flow로부터 전달받는 `x`, `y`, `width`, `height` props를 무시하고 100% 크기로 렌더링하고 있었음.
- **수정**: 해당 props를 SVG `rect` 속성에 정확히 매핑하여 1:1 동기화 구현.

#### B. 정보 시각화 (Visual Feedback)
- 단순한 색상 블록 대신 **정보 카드(Info Card)** 형태로 개편.
- **Start**: 녹색 원형 (진입점 강조)
- **End**: 빨간색 원형 (종료점 강조)
- **Question**: ID(`Q1`)와 Title이 텍스트로 렌더링되는 화이트 카드. 미니맵만 보고도 설문 흐름 파악 가능.
- **Edges**: 가독성을 위해 인디고(Indigo) 계열 컬러 적용.

#### C. 드래깅 & 도킹 시스템 (Dragging & Docking Architecture)
- **요구사항**: 미니맵이 화면을 가리지 않도록 이동 가능해야 하고, 사이드바에 넣을 수 있어야 함.
- **기술적 난제**: 캔버스 위의 UI를 드래그하면, 뒤에 있는 캔버스가 같이 움직임(Panning).
- **해결**:
  1. `DraggableMiniMap` 컴포넌트 개발 및 최상위 컨테이너에 `nopan` 클래스 적용 (React Flow 이벤트 전파 차단).
  2. `isMiniMapDocked` 상태를 `Global UI Store`에 추가.
  3. **Context Lifting**: 미니맵이 캔버스 밖(사이드바)으로 나가야 하므로, `ReactFlowProvider`를 `QuestionPalette`와 `CanvasArea`를 모두 감싸는 상위(`BuilderLayout`)로 이동.
  4. 드래그 위치가 좌측 영역에 진입하면 `Docker Zone` 활성화 시각 효과 구현.

---

### 2-3. 속성 패널(Property Panel) & 데이터 로직

#### A. 지능형 필드 제어 (Conditional Visibility)
- **Likert Scale 연동**: "Likert Scale" 체크박스 활성화 시에만 `BranchingTab`의 옵션 목록에 "Score(배점)" 입력 필드가 나타나도록 로직 구현.
- **컴포넌트 통신**: `BasicInfoTab`의 설정값이 `Store`를 통해 `BranchingTab` -> `SortableOptionItem`으로 전파되는 데이터 흐름 구축.

#### B. 용어 및 UI 정제
- **UX Writing**: "단일 경로" -> "단일 분기", "Likert Scale 형태로 표시" -> "Likert Scale" 등 사용자 친화적 용어로 수정.
- **린트 오류 해결**: 타입스크립트 인터페이스(`SortableOptionItemProps`) 정의를 엄격하게 수정하여 빌드 안정성 확보.

---

## 3. 현재 시스템 현황 (Current System Status)

### 3-1. 구현 완료 (Completed)
- [x] **Visual Node Builder Core**: 노드 생성, 이동, 삭제, 복제.
- [x] **Advanced Connection**: Port 분리, 정밀 연결, 사이클 방지.
- [x] **Smart MiniMap**: 드래그 이동, 사이드바 도킹/해제, 정보 카드 렌더링.
- [x] **Validation System**: 고립 노드 검출(개선된 로직), 필수값 체크.
- [x] **Property Management**: 질문 유형별 속성 편집, Likert 조건부 로직.

### 3-2. 기술 스택 현행화 (Technology Stack)
- **Framework**: Next.js 14+ (App Router)
- **Visualization**: React Flow 12+ (XYFlow)
- **State**: Zustand + Immer
- **Styling**: Tailwind CSS + Shadcn/UI
- **Icons**: Lucide React

---

## 4. 향후 계획 (Next Steps)
- **Undo/Redo History**: `zundo` 또는 커스텀 미들웨어를 통한 실행 취소 기능 완성.
- **Zoom/Pan Control**: 캔버스 컨트롤러 UI 고도화.
- **Keyboard Shortcuts**: 단축키(Delete, Ctrl+C/V 등) 액션 매핑.
- **Export/Import**: 완성된 설문을 JSON으로 내보내고 불러오는 기능 검증.

---

## 5. 소스 구성 및 프로젝트 구조 (Project Structure)

현재 `survey-builder`의 핵심 소스 코드 구조는 다음과 같습니다.

```
survey-builder/src/
├── app/                    # Next.js App Router (페이지 라우팅)
├── components/
│   ├── builder/            # 설문 빌더 핵심 모듈
│   │   ├── BuilderHeader.tsx
│   │   ├── BuilderLayout.tsx
│   │   ├── canvas/         # React Flow 캔버스 영역
│   │   │   ├── CanvasArea.tsx
│   │   │   ├── DraggableMiniMap.tsx # 커스텀 미니맵
│   │   │   └── MiniMapNode.tsx      # 미니맵 전용 노드
│   │   ├── nodes/          # 커스텀 노드 컴포넌트
│   │   │   ├── QuestionNode.tsx     # 핵심 질문 노드
│   │   │   └── StartNode.tsx, EndNode.tsx
│   │   ├── palette/        # 좌측 질문 팔레트
│   │   └── property/       # 우측 속성 편집 패널
│   └── ui/                 # Shadcn/UI 기반 공통 컴포넌트
├── lib/
│   ├── transform/          # JSON <-> Graph 데이터 변환 로직
│   └── validaton/          # Zod 스키마 및 유효성 검증
├── stores/                 # Zustand 전역 상태 관리
│   ├── useSurveyStore.ts   # 설문 데이터 및 그래프 상태
│   └── useUIStore.ts       # UI 상태 (패널, 모달, 미니맵 등)
└── types/                  # TypeScript 타입 정의 (Graph, Survey)
```

## 6. 테스트 환경 및 방법 (Test Environment & Methodology)

### 6-1. 개발 및 테스트 환경
- **OS**: Windows
- **Node.js**: v18+ (Recommended)
- **Local Server**: `http://localhost:5000`
- **Command**: `npm run dev` (Next.js 개발 서버 실행)

### 6-2. 테스트 방법론
1.  **단위 테스트 (Unit Testing)**
    -   **대상**: 유틸리티 함수 (`lib/transform`, `lib/validation`)
    -   **도구**: Jest (설정 예정)
    -   **검증 항목**: JSON 변환 로직의 정확성, Zod 스키마 검증 통과 여부.
2.  **UI/기능 테스트 (Manual & Agent Verification)**
    -   **Browser Subagent 활용**: Antigravity의 브라우저 에이전트를 통해 실제 사용자 시나리오(드래그, 연결, 속성 변경)를 시뮬레이션.
    -   **주요 시나리오**:
        -   Start 노드에서 Question 노드로 연결 생성.
        -   Question 노드 추가 및 속성 변경 (Likert Scale 등).
        -   미니맵 드래그 이동 및 사이드바 도킹.
3.  **구조적 검증 (Structural Verification)**
    -   **Lint/Type Check**: `npm run lint` 및 TypeScript 컴파일러를 통한 정적 분석.
    -   **Component Review**: 주요 컴포넌트의 Props 및 State 관리 로직 코드 리뷰.
