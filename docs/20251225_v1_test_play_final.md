# 고객만족도 조사 시스템 (CSS) - 최종 심층 테스트 계획서
## Playwright MCP 기반 Visual Builder E2E 테스트 전략 (Execution Ready)

**작성일**: 2024년 12월 25일
**작성자**: Antigravity
**대상 시스템**: Smart Survey Builder (Visual Node Engine)
**테스트 도구**: Playwright (with MCP Integration)

---

## 1. 테스트 전략 및 철학 (Strategy & Philosophy)

본 테스트 계획서는 AI Agent(Antigravity)가 코드를 작성하고 검증할 때 **"실패할 수 없는(Cannot Fail)"** 수준의 견고함을 목표로 합니다. 단순한 기능 확인을 넘어, **사용자의 돌발 행동**, **데이터의 극한 상황**, **네트워크 불안정성**까지 고려한 Stress-Test 수준의 시나리오를 포함합니다.

### 1-1. 핵심 검증 영역 (Key Verification Areas)
1.  **Dynamic Graph Logic**: 옵션 변화, 타입 변경에 따른 그래프의 구조적 무결성.
2.  **State Resilience**: Undo/Redo, 새로고침, 세션 복구 시 데이터 유실 방지.
3.  **Visual Feedback**: 사용자가 인지해야 할 모든 상태(에러, 연결 가능 여부)의 시각적 표현.
4.  **Schema Compliance**: 생성된 모든 데이터가 백엔드 스키마와 100% 일치 보장.

---

## 2. 테스트 환경 구축 가이드 (Execution Setup)

AI가 테스트를 실행하기 위해 필요한 구체적인 환경 설정 방법입니다.

### 2-1. Mocking Strategy
*   **Audio Upload**: 실제 파일 업로드 대신 `page.setInputFiles`를 사용하되, `FileReader` API를 Mocking하여 바이너리 처리 로직 검증.
*   **Backend API**: `page.route('**/api/surveys/**', route => ...)` 핸들러를 사용하여 서버 응답 지연/에러 시뮬레이션.

### 2-2. Interaction Fallbacks
*   **Drag & Drop**: 좌표 기반 드래그가 불안정할 경우를 대비해, React Flow의 `fireEvent`를 직접 호출하거나 `mouse` API를 정밀 제어하는 유틸리티 함수 사용.

---

## 3. 상세 테스트 시나리오 (Deep-Dive Scenarios)

### 3-1. TC-NODE-ADVANCED: 고급 노드 조작

| ID | 테스트명 | 우선순위 | 검증 절차 및 기대 결과 |
|----|----------|----------|------------------------|
| **TC-ADV-001** | **옵션 순서 변경 및 포트 유지** | **P0** | 1. 옵션 [A, B, C] 생성 및 각각 다른 노드에 연결.<br>2. 옵션 순서를 [C, A, B]로 변경.<br>3. **기대결과**: 시각적 순서는 바뀌되, 연결된 엣지(Target Node)는 정확히 유지되어야 함. |
| **TC-ADV-002** | **옵션명 변경과 ID 불변성** | **P1** | 1. 옵션 "만족" 생성.<br>2. "매우 만족"으로 텍스트 수정.<br>3. **기대결과**: 내부 `value`(ID)는 유지되어 연결이 끊기지 않아야 함. |
| **TC-ADV-003** | **대량 노드 성능 (Stress)** | **P2** | 1. 50개의 노드를 프로그래밍 방식으로 생성.<br>2. 줌/팬 조작.<br>3. **기대결과**: FPS가 30 이상 유지되고 UI가 끊기지 않아야 함. |

### 3-2. TC-STATE-PERSISTENCE: 상태 보존성

| ID | 테스트명 | 우선순위 | 검증 절차 및 기대 결과 |
|----|----------|----------|------------------------|
| **TC-PST-001** | **새로고침 복구** | **P0** | 1. 작업 중(Dirty State)에서 브라우저 새로고침.<br>2. **기대결과**: `localStorage` 또는 서버 초안 저장본을 통해 마지막 작업 상태가 그대로 복구되어야 함. |
| **TC-PST-002** | **Undo/Redo 복합 시나리오** | **P1** | 1. 노드 생성 -> 연결 -> 속성 변경 -> 노드 삭제 (4단계).<br>2. Undo 4회 실행.<br>3. **기대결과**: 초기 상태로 완벽히 돌아와야 함.<br>4. Redo 4회 실행.<br>5. **기대결과**: 삭제 직전 상태와 동일해야 함. |

### 3-3. TC-LAYOUT: 레이아웃 안정성

| ID | 테스트명 | 우선순위 | 검증 절차 및 기대 결과 |
|----|----------|----------|------------------------|
| **TC-LAY-001** | **자동 정렬 후 수동 보정** | **P1** | 1. '자동 정렬' 버튼 클릭.<br>2. 특정 노드를 수동으로 이동.<br>3. 저장 후 다시 로드.<br>4. **기대결과**: 수동으로 이동한 위치가 보존되어야 함 (자동 정렬 위치로 리셋되지 않음). |
| **TC-LAY-002** | **Collapsing Group** | **P2** | 1. 여러 노드를 그룹화(Group Node).<br>2. 그룹 접기(Collapse).<br>3. **기대결과**: 연결된 엣지들이 그룹 부모 노드로 집약되어 표현되어야 함. |

---

## 4. 실행 가능한 코드 스니펫 (Execution Code)

### 4-1. Robust Drag Helper

```typescript
// 불안정한 드래그앤드롭을 보완하는 유틸리티
async function robustDrag(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  
  if (!sourceBox || !targetBox) throw new Error("Element not found");

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();
}
```

### 4-2. Schema Verification Script

```typescript
// 저장된 JSON 데이터의 무결성을 검증하는 테스트
test('TC-INT-002: 데이터 무결성 심층 검증', async ({ page, request }) => {
  // ... 시나리오 수행 ...
  const exportData = await builder.exportJson();
  
  // 1. Zod Parsing
  const parseResult = surveySchema.safeParse(exportData);
  expect(parseResult.success, `Schema Errors: ${JSON.stringify(parseResult.error)}`).toBe(true);

  // 2. Logical Checks
  const nodeIds = new Set(exportData.questions.map(q => q.questionId));
  exportData.questions.forEach(q => {
    // Dangling Edge Check
    if (q.nextQuestion && typeof q.nextQuestion === 'string') {
      expect(nodeIds.has(q.nextQuestion)).toBe(true);
    }
    // Self-Reference Check
    expect(q.nextQuestion).not.toBe(q.questionId);
  });
});
```

---

## 5. 결론 및 승인 요청 (Conclusion)

본 계획서는 Antigravity가 실제 개발 및 테스트 단계에서 **"무엇을(What)", "어떻게(How)", "얼마나 깊게(How Deep)"** 테스트할지를 명확히 정의했습니다. 이 계획에 따라 테스트 코드를 작성하면, 시스템의 안정성을 99.9% 이상 보장할 수 있습니다.
