# 고객만족도 조사 시스템 (CSS) - 테스트 계획서

## Playwright MCP 기반 E2E 테스트 전략

**작성일**: 2024년 12월 25일
**작성자**: Claude Opus 4.5
**대상 시스템**: Survey Builder (Visual Node Builder)
**테스트 도구**: Playwright MCP (Model Context Protocol)

---

## 1. 테스트 전략 개요

### 1-1. 테스트 피라미드

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Playwright MCP
                    │   (10-15%)      │     전체 사용자 시나리오
                    ├─────────────────┤
                    │ Integration     │  ← Component + Store 통합
                    │   (20-30%)      │
                    ├─────────────────┤
                    │   Unit Tests    │  ← 개별 함수/컴포넌트
                    │   (60-70%)      │
                    └─────────────────┘
```

### 1-2. Playwright MCP 테스트 범위

| 카테고리 | 테스트 유형 | 우선순위 |
|----------|-------------|----------|
| **Builder Core** | Canvas 렌더링, 줌/팬 | P0 |
| **Node 상호작용** | 생성, 선택, 삭제, 이동 | P0 |
| **Edge 연결** | 포트 연결, 분기 로직 | P0 |
| **Property Panel** | 속성 편집, 실시간 반영 | P1 |
| **Validation** | 에러 표시, 실시간 검증 | P1 |
| **Import/Export** | JSON 불러오기/저장 | P1 |
| **반응형** | 다양한 화면 크기 | P2 |
| **접근성** | 키보드 내비게이션 | P2 |

---

## 2. 테스트 환경 설정

### 2-1. Playwright MCP 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'tablet',
      use: {
        viewport: { width: 1024, height: 768 },
        isMobile: false,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2-2. 테스트 유틸리티

```typescript
// tests/e2e/utils/builder-helpers.ts
import { Page, Locator, expect } from '@playwright/test';

export class BuilderPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly palette: Locator;
  readonly propertyPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('[data-testid="canvas-area"]');
    this.palette = page.locator('[data-testid="question-palette"]');
    this.propertyPanel = page.locator('[data-testid="property-panel"]');
  }

  async goto() {
    await this.page.goto('/builder');
    await this.canvas.waitFor({ state: 'visible' });
  }

  async getNode(nodeId: string): Promise<Locator> {
    return this.canvas.locator(`[data-testid="node-${nodeId}"]`);
  }

  async getEdge(edgeId: string): Promise<Locator> {
    return this.canvas.locator(`[data-testid="edge-${edgeId}"]`);
  }

  async selectNode(nodeId: string) {
    const node = await this.getNode(nodeId);
    await node.click();
  }

  async dragPaletteItem(itemType: string, targetPosition: { x: number; y: number }) {
    const paletteItem = this.palette.locator(`[data-testid="palette-${itemType}"]`);
    const canvasBounds = await this.canvas.boundingBox();

    if (!canvasBounds) throw new Error('Canvas not found');

    await paletteItem.dragTo(this.canvas, {
      targetPosition: {
        x: targetPosition.x - canvasBounds.x,
        y: targetPosition.y - canvasBounds.y,
      },
    });
  }

  async connectNodes(sourceId: string, targetId: string, sourceHandle = 'output-default') {
    const sourceNode = await this.getNode(sourceId);
    const targetNode = await this.getNode(targetId);

    const sourcePort = sourceNode.locator(`[data-handleid="${sourceHandle}"]`);
    const targetPort = targetNode.locator('[data-handleid="input"]');

    await sourcePort.dragTo(targetPort);
  }

  async deleteNode(nodeId: string) {
    const node = await this.getNode(nodeId);
    await node.click({ button: 'right' });
    await this.page.locator('[data-testid="context-menu-delete"]').click();
  }

  async zoomCanvas(level: number) {
    const zoomControl = this.page.locator('[data-testid="zoom-control"]');
    await zoomControl.fill(String(level));
  }

  async exportJson(): Promise<object> {
    await this.page.locator('[data-testid="export-button"]').click();
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator('[data-testid="export-confirm"]').click();
    const download = await downloadPromise;
    const content = await download.path();
    // JSON 파싱 로직
    return {};
  }
}
```

---

## 3. 테스트 케이스 상세

### 3-1. TC-BUILDER: 빌더 코어 기능

#### TC-BUILDER-001: Canvas 초기 렌더링

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-BUILDER-001 |
| **테스트명** | Canvas 초기 렌더링 확인 |
| **우선순위** | P0 |
| **전제조건** | 빌더 페이지 접근 가능 |
| **테스트 단계** | 1. `/builder` 페이지 접근<br>2. Canvas 영역 렌더링 확인<br>3. 기본 컨트롤(줌, 팬) 표시 확인 |
| **예상 결과** | Canvas가 그리드 패턴과 함께 표시됨 |
| **검증 방법** | `data-testid="canvas-area"` 요소 존재 확인 |

```typescript
// tests/e2e/builder/canvas.spec.ts
import { test, expect } from '@playwright/test';
import { BuilderPage } from '../utils/builder-helpers';

test.describe('Canvas 렌더링', () => {
  test('TC-BUILDER-001: Canvas 초기 렌더링', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // Canvas 존재 확인
    await expect(builder.canvas).toBeVisible();

    // 그리드 패턴 확인
    const gridPattern = page.locator('.react-flow__background');
    await expect(gridPattern).toBeVisible();

    // 줌/팬 컨트롤 확인
    const controls = page.locator('.react-flow__controls');
    await expect(controls).toBeVisible();
  });
});
```

#### TC-BUILDER-002: Canvas 줌/팬 기능

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-BUILDER-002 |
| **테스트명** | Canvas 줌/팬 기능 동작 확인 |
| **우선순위** | P0 |
| **전제조건** | Canvas 렌더링 완료 |
| **테스트 단계** | 1. 마우스 휠로 줌 인/아웃<br>2. 마우스 드래그로 팬 이동<br>3. 줌 컨트롤 버튼 클릭 |
| **예상 결과** | 줌/팬이 부드럽게 동작함 |
| **검증 방법** | transform 스타일 값 변화 확인 |

```typescript
test('TC-BUILDER-002: Canvas 줌/팬 기능', async ({ page }) => {
  const builder = new BuilderPage(page);
  await builder.goto();

  // 줌 인
  await builder.canvas.click();
  await page.mouse.wheel(0, -100);

  const viewport = page.locator('.react-flow__viewport');
  const transformBefore = await viewport.getAttribute('style');

  // 팬 이동
  await builder.canvas.hover();
  await page.mouse.down();
  await page.mouse.move(100, 100);
  await page.mouse.up();

  const transformAfter = await viewport.getAttribute('style');
  expect(transformBefore).not.toBe(transformAfter);

  // 줌 리셋 버튼
  await page.locator('[data-testid="zoom-reset"]').click();
  const zoomLevel = page.locator('[data-testid="zoom-level"]');
  await expect(zoomLevel).toHaveText('100%');
});
```

---

### 3-2. TC-NODE: 노드 관리 기능

#### TC-NODE-001: 노드 생성 (Drag & Drop)

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-NODE-001 |
| **테스트명** | Palette에서 Canvas로 노드 드래그 앤 드롭 |
| **우선순위** | P0 |
| **전제조건** | Canvas 렌더링 완료, Palette 표시 |
| **테스트 단계** | 1. Palette에서 "객관식" 아이템 선택<br>2. Canvas 영역으로 드래그<br>3. 드롭하여 노드 생성 |
| **예상 결과** | 새 QuestionNode가 Canvas에 생성됨 |
| **검증 방법** | 새 노드 요소 존재 확인, Store 상태 확인 |

```typescript
test.describe('노드 관리', () => {
  test('TC-NODE-001: 노드 생성 (Drag & Drop)', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 초기 노드 수 확인
    const initialNodes = await page.locator('[data-testid^="node-"]').count();

    // 팔레트에서 객관식 아이템 드래그
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });

    // 새 노드 생성 확인
    const newNodes = await page.locator('[data-testid^="node-"]').count();
    expect(newNodes).toBe(initialNodes + 1);

    // 생성된 노드 타입 확인
    const newNode = page.locator('[data-testid^="node-"]').last();
    await expect(newNode.locator('[data-question-type="multiple_choice"]')).toBeVisible();
  });

  test('TC-NODE-002: 노드 선택', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });

    // 노드 클릭하여 선택
    const node = page.locator('[data-testid^="node-"]').first();
    await node.click();

    // 선택 상태 확인 (선택된 노드에 selected 클래스 또는 속성)
    await expect(node).toHaveAttribute('data-selected', 'true');

    // PropertyPanel에 해당 노드 정보 표시 확인
    await expect(builder.propertyPanel).toBeVisible();
    await expect(builder.propertyPanel.locator('[data-testid="property-title"]')).toBeVisible();
  });

  test('TC-NODE-003: 노드 삭제', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });
    const nodeCount = await page.locator('[data-testid^="node-"]').count();

    // 노드 우클릭으로 컨텍스트 메뉴 열기
    const node = page.locator('[data-testid^="node-"]').first();
    await node.click({ button: 'right' });

    // 삭제 메뉴 클릭
    await page.locator('[data-testid="context-menu-delete"]').click();

    // 삭제 확인 다이얼로그
    await page.locator('[data-testid="confirm-delete"]').click();

    // 노드 삭제 확인
    const newNodeCount = await page.locator('[data-testid^="node-"]').count();
    expect(newNodeCount).toBe(nodeCount - 1);
  });

  test('TC-NODE-004: 노드 이동', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });

    const node = page.locator('[data-testid^="node-"]').first();
    const initialPosition = await node.boundingBox();

    // 노드 드래그하여 이동
    await node.hover();
    await page.mouse.down();
    await page.mouse.move(500, 400);
    await page.mouse.up();

    const newPosition = await node.boundingBox();

    expect(newPosition?.x).not.toBe(initialPosition?.x);
    expect(newPosition?.y).not.toBe(initialPosition?.y);
  });
});
```

---

### 3-3. TC-EDGE: 엣지 연결 기능

#### TC-EDGE-001: 기본 노드 연결

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-EDGE-001 |
| **테스트명** | 두 노드 간 기본 연결 생성 |
| **우선순위** | P0 |
| **전제조건** | 2개 이상의 노드가 Canvas에 존재 |
| **테스트 단계** | 1. 첫 번째 노드의 Output Port 클릭<br>2. 두 번째 노드의 Input Port로 드래그<br>3. 연결선 생성 확인 |
| **예상 결과** | Bezier Curve 연결선이 생성됨 |
| **검증 방법** | SVG path 요소 존재 확인 |

```typescript
test.describe('엣지 연결', () => {
  test('TC-EDGE-001: 기본 노드 연결', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 두 개의 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 200, y: 300 });
    await builder.dragPaletteItem('text_opinion', { x: 500, y: 300 });

    const nodes = page.locator('[data-testid^="node-"]');
    const node1 = nodes.nth(0);
    const node2 = nodes.nth(1);

    // Output Port에서 Input Port로 드래그
    const sourcePort = node1.locator('[data-handleid="output-default"]');
    const targetPort = node2.locator('[data-handleid="input"]');

    await sourcePort.dragTo(targetPort);

    // 엣지 생성 확인
    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(1);
  });

  test('TC-EDGE-002: 조건부 분기 연결', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 분기 소스 노드 (객관식) 추가
    await builder.dragPaletteItem('multiple_choice', { x: 200, y: 300 });

    // 타겟 노드들 추가
    await builder.dragPaletteItem('text_opinion', { x: 500, y: 200 });
    await builder.dragPaletteItem('text_opinion', { x: 500, y: 400 });

    const sourceNode = page.locator('[data-testid^="node-"]').nth(0);
    const targetNode1 = page.locator('[data-testid^="node-"]').nth(1);
    const targetNode2 = page.locator('[data-testid^="node-"]').nth(2);

    // 옵션 1 -> 타겟1 연결
    const port1 = sourceNode.locator('[data-handleid="output-1"]');
    await port1.dragTo(targetNode1.locator('[data-handleid="input"]'));

    // 옵션 2 -> 타겟2 연결
    const port2 = sourceNode.locator('[data-handleid="output-2"]');
    await port2.dragTo(targetNode2.locator('[data-handleid="input"]'));

    // 두 개의 분기 엣지 확인
    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(2);
  });

  test('TC-EDGE-003: 엣지 삭제', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드와 연결 생성
    await builder.dragPaletteItem('multiple_choice', { x: 200, y: 300 });
    await builder.dragPaletteItem('text_opinion', { x: 500, y: 300 });

    const node1 = page.locator('[data-testid^="node-"]').nth(0);
    const node2 = page.locator('[data-testid^="node-"]').nth(1);

    await node1.locator('[data-handleid="output-default"]').dragTo(
      node2.locator('[data-handleid="input"]')
    );

    // 엣지 선택
    const edge = page.locator('.react-flow__edge').first();
    await edge.click();

    // Delete 키로 삭제
    await page.keyboard.press('Delete');

    // 엣지 삭제 확인
    await expect(page.locator('.react-flow__edge')).toHaveCount(0);
  });
});
```

---

### 3-4. TC-PROPERTY: 속성 패널

#### TC-PROPERTY-001: 질문 제목 편집

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-PROPERTY-001 |
| **테스트명** | PropertyPanel에서 질문 제목 편집 |
| **우선순위** | P1 |
| **전제조건** | 노드가 선택된 상태 |
| **테스트 단계** | 1. 노드 선택<br>2. PropertyPanel의 제목 필드 수정<br>3. 노드에 변경 사항 반영 확인 |
| **예상 결과** | 노드 헤더의 제목이 실시간 업데이트됨 |
| **검증 방법** | 노드 내 제목 텍스트 확인 |

```typescript
test.describe('속성 패널', () => {
  test('TC-PROPERTY-001: 질문 제목 편집', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가 및 선택
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });
    const node = page.locator('[data-testid^="node-"]').first();
    await node.click();

    // PropertyPanel에서 제목 수정
    const titleInput = builder.propertyPanel.locator('[data-testid="property-title-input"]');
    await titleInput.clear();
    await titleInput.fill('수정된 질문 제목');

    // 노드에 반영 확인
    await expect(node.locator('[data-testid="node-title"]')).toContainText('수정된 질문 제목');
  });

  test('TC-PROPERTY-002: 옵션 추가/삭제', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 객관식 노드 추가 및 선택
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });
    const node = page.locator('[data-testid^="node-"]').first();
    await node.click();

    // Options 탭 클릭
    await builder.propertyPanel.locator('[data-testid="tab-options"]').click();

    // 초기 옵션 수 확인
    const initialOptions = await builder.propertyPanel.locator('[data-testid^="option-"]').count();

    // 옵션 추가
    await builder.propertyPanel.locator('[data-testid="add-option"]').click();
    const newOptionCount = await builder.propertyPanel.locator('[data-testid^="option-"]').count();
    expect(newOptionCount).toBe(initialOptions + 1);

    // 옵션 삭제
    await builder.propertyPanel.locator('[data-testid="delete-option-0"]').click();
    const afterDeleteCount = await builder.propertyPanel.locator('[data-testid^="option-"]').count();
    expect(afterDeleteCount).toBe(newOptionCount - 1);
  });

  test('TC-PROPERTY-003: 검증 규칙 설정', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 텍스트 의견 노드 추가 및 선택
    await builder.dragPaletteItem('text_opinion', { x: 400, y: 300 });
    const node = page.locator('[data-testid^="node-"]').first();
    await node.click();

    // Validation 탭 클릭
    await builder.propertyPanel.locator('[data-testid="tab-validation"]').click();

    // 최소 글자 수 설정
    const minLengthInput = builder.propertyPanel.locator('[data-testid="validation-min-length"]');
    await minLengthInput.fill('10');

    // 최대 글자 수 설정
    const maxLengthInput = builder.propertyPanel.locator('[data-testid="validation-max-length"]');
    await maxLengthInput.fill('500');

    // 변경 사항 저장 확인 (Store 또는 노드 데이터에 반영)
    await expect(minLengthInput).toHaveValue('10');
    await expect(maxLengthInput).toHaveValue('500');
  });
});
```

---

### 3-5. TC-VALIDATION: 검증 시스템

#### TC-VALIDATION-001: 순환 참조 감지

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-VALIDATION-001 |
| **테스트명** | 순환 참조 연결 시 경고 표시 |
| **우선순위** | P1 |
| **전제조건** | 최소 2개의 노드가 연결된 상태 |
| **테스트 단계** | 1. A -> B 연결 생성<br>2. B -> A 연결 시도<br>3. 순환 참조 경고 표시 확인 |
| **예상 결과** | 연결 차단 또는 빨간색 경고 표시 |
| **검증 방법** | 에러 메시지 또는 시각적 표시 확인 |

```typescript
test.describe('검증 시스템', () => {
  test('TC-VALIDATION-001: 순환 참조 감지', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 두 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 200, y: 300 });
    await builder.dragPaletteItem('multiple_choice', { x: 500, y: 300 });

    const node1 = page.locator('[data-testid^="node-"]').nth(0);
    const node2 = page.locator('[data-testid^="node-"]').nth(1);

    // A -> B 연결
    await node1.locator('[data-handleid="output-default"]').dragTo(
      node2.locator('[data-handleid="input"]')
    );

    // B -> A 연결 시도 (순환)
    await node2.locator('[data-handleid="output-default"]').dragTo(
      node1.locator('[data-handleid="input"]')
    );

    // 경고 메시지 확인
    const errorToast = page.locator('[data-testid="error-toast"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('순환 참조');
  });

  test('TC-VALIDATION-002: 고립 노드 감지', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 세 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 200, y: 300 });
    await builder.dragPaletteItem('multiple_choice', { x: 500, y: 300 });
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 500 }); // 고립될 노드

    const node1 = page.locator('[data-testid^="node-"]').nth(0);
    const node2 = page.locator('[data-testid^="node-"]').nth(1);

    // node1 -> node2 연결 (node3는 고립)
    await node1.locator('[data-handleid="output-default"]').dragTo(
      node2.locator('[data-handleid="input"]')
    );

    // 검증 버튼 클릭
    await page.locator('[data-testid="validate-button"]').click();

    // 고립 노드 경고 확인
    const orphanNode = page.locator('[data-testid^="node-"]').nth(2);
    await expect(orphanNode).toHaveAttribute('data-has-error', 'true');

    // 에러 메시지 확인
    await orphanNode.hover();
    const errorTooltip = page.locator('[data-testid="error-tooltip"]');
    await expect(errorTooltip).toContainText('도달할 수 없습니다');
  });

  test('TC-VALIDATION-003: 필수 필드 누락 감지', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });
    const node = page.locator('[data-testid^="node-"]').first();
    await node.click();

    // 제목 비우기
    const titleInput = builder.propertyPanel.locator('[data-testid="property-title-input"]');
    await titleInput.clear();

    // 다른 곳 클릭하여 blur
    await builder.canvas.click();

    // 에러 상태 확인
    await expect(node).toHaveAttribute('data-has-error', 'true');
  });
});
```

---

### 3-6. TC-IMPORT-EXPORT: JSON 불러오기/저장

#### TC-IMPORT-EXPORT-001: JSON 내보내기

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-IMPORT-EXPORT-001 |
| **테스트명** | 현재 설문을 JSON으로 내보내기 |
| **우선순위** | P1 |
| **전제조건** | 최소 1개의 노드가 존재 |
| **테스트 단계** | 1. Export 버튼 클릭<br>2. 파일 다운로드 확인<br>3. JSON 구조 검증 |
| **예상 결과** | 유효한 css.json 파일이 다운로드됨 |
| **검증 방법** | 다운로드 파일 내용 파싱 및 검증 |

```typescript
test.describe('Import/Export', () => {
  test('TC-IMPORT-EXPORT-001: JSON 내보내기', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 300, y: 300 });
    await builder.dragPaletteItem('text_opinion', { x: 600, y: 300 });

    // Export 버튼 클릭
    await page.locator('[data-testid="export-button"]').click();

    // 다운로드 대기
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-confirm"]').click();
    const download = await downloadPromise;

    // 파일명 확인
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    // 파일 내용 검증
    const path = await download.path();
    const fs = require('fs');
    const content = JSON.parse(fs.readFileSync(path, 'utf-8'));

    expect(content).toHaveProperty('surveyId');
    expect(content).toHaveProperty('questions');
    expect(content.questions).toHaveLength(2);
  });

  test('TC-IMPORT-EXPORT-002: JSON 불러오기', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // Import 버튼 클릭
    await page.locator('[data-testid="import-button"]').click();

    // 파일 선택 다이얼로그 (테스트용 JSON 파일)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/sample-survey.json');

    // 로딩 완료 대기
    await page.waitForSelector('[data-testid^="node-"]');

    // 불러온 노드 확인
    const nodes = page.locator('[data-testid^="node-"]');
    await expect(nodes).toHaveCount(7); // sample-survey.json의 질문 수

    // 엣지 확인
    const edges = page.locator('.react-flow__edge');
    await expect(edges.first()).toBeVisible();
  });
});
```

---

### 3-7. TC-A11Y: 접근성 테스트

#### TC-A11Y-001: 키보드 내비게이션

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-A11Y-001 |
| **테스트명** | 키보드만으로 노드 탐색 및 선택 |
| **우선순위** | P2 |
| **전제조건** | 복수의 노드가 Canvas에 존재 |
| **테스트 단계** | 1. Tab 키로 노드 포커스 이동<br>2. Enter 키로 노드 선택<br>3. Delete 키로 노드 삭제 |
| **예상 결과** | 키보드만으로 모든 주요 기능 사용 가능 |
| **검증 방법** | 포커스 이동 및 액션 실행 확인 |

```typescript
test.describe('접근성', () => {
  test('TC-A11Y-001: 키보드 내비게이션', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 300, y: 300 });
    await builder.dragPaletteItem('text_opinion', { x: 600, y: 300 });

    // Tab으로 첫 번째 노드로 포커스 이동
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Enter로 선택
    await page.keyboard.press('Enter');

    // 선택 확인
    const selectedNode = page.locator('[data-selected="true"]');
    await expect(selectedNode).toBeVisible();

    // Arrow 키로 다음 노드로 이동
    await page.keyboard.press('ArrowRight');

    // 새 노드 선택 확인
    const newSelectedNode = page.locator('[data-selected="true"]');
    const id1 = await selectedNode.getAttribute('data-testid');
    const id2 = await newSelectedNode.getAttribute('data-testid');
    expect(id1).not.toBe(id2);
  });

  test('TC-A11Y-002: 스크린 리더 호환성', async ({ page }) => {
    const builder = new BuilderPage(page);
    await builder.goto();

    // 노드 추가
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });

    // ARIA 속성 확인
    const node = page.locator('[data-testid^="node-"]').first();

    await expect(node).toHaveAttribute('role', 'button');
    await expect(node).toHaveAttribute('aria-label');
    await expect(node).toHaveAttribute('tabindex', '0');
  });
});
```

---

### 3-8. TC-RESPONSIVE: 반응형 테스트

#### TC-RESPONSIVE-001: 태블릿 뷰포트

| 항목 | 내용 |
|------|------|
| **테스트 ID** | TC-RESPONSIVE-001 |
| **테스트명** | 태블릿 화면에서 빌더 레이아웃 |
| **우선순위** | P2 |
| **전제조건** | 없음 |
| **테스트 단계** | 1. 뷰포트를 1024x768로 설정<br>2. 빌더 페이지 접근<br>3. 레이아웃 확인 |
| **예상 결과** | Palette가 접히고, PropertyPanel이 슬라이드 형태로 변경 |
| **검증 방법** | 요소 visibility 및 레이아웃 확인 |

```typescript
test.describe('반응형', () => {
  test('TC-RESPONSIVE-001: 태블릿 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const builder = new BuilderPage(page);
    await builder.goto();

    // Palette가 접힌 상태 (토글 버튼 표시)
    const paletteToggle = page.locator('[data-testid="palette-toggle"]');
    await expect(paletteToggle).toBeVisible();

    // Canvas는 여전히 사용 가능
    await expect(builder.canvas).toBeVisible();

    // PropertyPanel은 슬라이드 형태
    await builder.dragPaletteItem('multiple_choice', { x: 400, y: 300 });
    const node = page.locator('[data-testid^="node-"]').first();
    await node.click();

    // PropertyPanel이 오버레이로 표시
    const propertySheet = page.locator('[data-testid="property-sheet"]');
    await expect(propertySheet).toHaveClass(/slide-in/);
  });

  test('TC-RESPONSIVE-002: 모바일 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const builder = new BuilderPage(page);
    await builder.goto();

    // 모바일에서는 경고 메시지 또는 제한된 기능 안내
    const mobileWarning = page.locator('[data-testid="mobile-warning"]');
    await expect(mobileWarning).toBeVisible();
  });
});
```

---

## 4. 테스트 데이터 (Fixtures)

### 4-1. sample-survey.json

```json
{
  "surveyId": "CS2024002",
  "version": "1.0",
  "title": "테스트 설문조사",
  "description": "테스트용 설문",
  "language": "ko",
  "supportedLanguages": ["ko"],
  "creator": {
    "name": "테스터",
    "department": "QA팀",
    "email": "test@test.com"
  },
  "schedule": {
    "date": { "start": "2024-01-01", "end": "2024-12-31" },
    "time": { "start": "09:00:00", "end": "18:00:00" },
    "offtime": [],
    "timeZone": "Asia/Seoul"
  },
  "settings": {
    "allowAnonymous": true,
    "allowRevision": true,
    "estimatedDuration": 5,
    "showProgress": true,
    "randomizeQuestions": false,
    "requireAllQuestions": false,
    "analytics": { "trackingEnabled": false, "collectMetadata": [] }
  },
  "sections": [
    { "sectionId": "SEC1", "title": "섹션1", "description": "", "questionIds": ["Q1", "Q2"], "required": true }
  ],
  "questions": [
    {
      "questionId": "Q1",
      "title": "테스트 질문 1",
      "sectionId": "SEC1",
      "questionType": "multiple_choice",
      "promptType": "text_prompt",
      "prompt": "테스트 프롬프트",
      "importance": "high",
      "required": true,
      "validation": { "minSelections": 1, "maxSelections": 1 },
      "options": [
        { "value": "1", "label": "옵션1", "score": 1 },
        { "value": "2", "label": "옵션2", "score": 2 }
      ],
      "nextQuestion": "Q2"
    },
    {
      "questionId": "Q2",
      "title": "테스트 질문 2",
      "sectionId": "SEC1",
      "questionType": "text_opinion",
      "promptType": "text_prompt",
      "prompt": "의견을 입력하세요",
      "importance": "medium",
      "required": false,
      "validation": { "minLength": 0, "maxLength": 1000, "pattern": null },
      "nextQuestion": null
    }
  ]
}
```

---

## 5. Playwright MCP 실행 가이드

### 5-1. MCP 도구를 통한 테스트 실행

```bash
# 전체 테스트 실행
npx playwright test

# 특정 테스트 파일 실행
npx playwright test tests/e2e/builder/canvas.spec.ts

# 특정 테스트만 실행
npx playwright test -g "TC-NODE-001"

# 브라우저 UI 모드로 실행
npx playwright test --ui

# 디버그 모드
npx playwright test --debug

# 특정 브라우저에서만 실행
npx playwright test --project=chromium

# 리포트 생성
npx playwright test --reporter=html
```

### 5-2. MCP를 통한 자동화 테스트

Playwright MCP를 사용하여 Claude가 직접 테스트를 실행할 수 있습니다:

```
# Claude Code에서 Playwright MCP 사용 예시

1. browser_navigate를 사용하여 빌더 페이지 접근
2. browser_snapshot으로 현재 상태 캡처
3. browser_click으로 요소 클릭
4. browser_type으로 텍스트 입력
5. browser_drag로 드래그 앤 드롭 수행
6. browser_evaluate로 JavaScript 실행하여 상태 확인
```

---

## 6. 테스트 결과 보고서 형식

### 6-1. 일일 테스트 보고서

```markdown
# 테스트 결과 보고서

**일자**: YYYY-MM-DD
**실행 환경**: Chrome 120 / Windows 11
**총 테스트**: 45
**통과**: 42
**실패**: 2
**스킵**: 1

## 실패한 테스트

### TC-EDGE-002: 조건부 분기 연결
- **상태**: FAILED
- **원인**: 동적 포트 렌더링 지연
- **스크린샷**: [링크]
- **조치**: 포트 렌더링 후 wait 추가 필요

### TC-VALIDATION-001: 순환 참조 감지
- **상태**: FAILED
- **원인**: Toast 메시지 selector 변경
- **스크린샷**: [링크]
- **조치**: selector 업데이트 필요
```

---

## 7. 결론

본 테스트 계획서는 Survey Builder의 핵심 기능에 대한 종합적인 E2E 테스트 전략을 제공합니다. Playwright MCP를 활용하여 Claude가 직접 테스트를 실행하고 검증할 수 있도록 설계되었습니다.

**주요 검증 영역:**
- Builder 코어 기능 (Canvas, 줌/팬)
- 노드 관리 (생성, 선택, 삭제, 이동)
- 엣지 연결 (기본 연결, 조건부 분기)
- 속성 패널 (편집, 실시간 반영)
- 검증 시스템 (순환 참조, 고립 노드, 필수 필드)
- Import/Export (JSON 변환)
- 접근성 및 반응형

---

**문서 버전**: v1.0
**최종 수정일**: 2024-12-25
**작성자**: Claude Opus 4.5
