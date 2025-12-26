# CSS Visual Builder 테스트 결과 보고서 (2025-12-25)

본 문서는 CSS(Customer Satisfaction Survey) Visual Builder의 핵심 기능 및 안정성 테스트 결과를 기록합니다.

## 테스트 결과 요약

| 테스트 그룹 | 항목 수 | 성공 | 실패 | 진행률 |
| :--- | :---: | :---: | :---: | :---: |
| UI/UX 기본 (Core) | 4 | 4 | 0 | 100% |
| 동적 편집 (Advanced) | 3 | 3 | 0 | 100% |
| 상태 유지 (Persistence) | 2 | 2 | 0 | 100% |
| 심층 검증 (Validation) | 3 | 3 | 0 | 100% |

---

## 상세 테스트 항목

| SEQ | ID | 테스트 그룹핑 | 세부항목 | 테스트 설명 | 진행 내용 | 결과 | 비고 |
| :-- | :-- | :--- | :--- | :--- | :--- | :-- | :--- |
| 1 | TC-BUILDER-001 | 핵심 기능 | 페이지 로드 | 빌더 환경 초기화 및 로드 | 브라우저 접속 후 CanvasArea, Palette, PropertyPanel 로드 확인 | **PASS** | 포트 5000 사용 |
| 2 | TC-NODE-001 | 핵심 기능 | 노드 생성 | 드래그 앤 드롭을 통한 노드 추가 | 팔레트에서 '객관식' 노드를 캔버스로 드래그하여 생성 확인 | **PASS** | |
| 3 | TC-EDGE-001 | 핵심 기능 | 엣지 연결 | 노드 간 연결성 테스트 | 시작 노드에서 질문 노드로의 엣지 연결 및 시각적 피드백 확인 | **PASS** | |
| 4 | TC-STATE-002 | 핵심 기능 | Undo/Redo | 복합 시나리오 편집 취소/재실행 | 노드 추가, 삭제, 연결 후 Ctrl+Z/Ctrl+Y 안정성 검증 | **PASS** | HistoryStore 리팩토링 완료 |
| 5 | TC-NODE-ADV-01 | 동적 편집 | 옵션 순서 변경 | 포트 유지 및 재정렬 | @dnd-kit을 이용한 옵션 순서 변경 시 엣지 유지 확인 | **PASS** | 포트 ID 불변성 유지 |
| 6 | TC-NODE-ADV-02 | 동적 편집 | ID 불변성 | 노드 이름 변경 시 안정성 | 질문 텍스트 변경 시에도 내부 ID(Q1, Q2 등) 및 연결 유지 | **PASS** | |
| 7 | TC-NODE-ADV-03 | 동적 편집 | 스트레스 테스트 | 대량 노드 성능 측정 | 50개 이상의 노드 생성 후 드래깅 및 줌 응답 속도 확인 | **PASS** | 생성 시간 약 95ms |
| 8 | TC-STATE-PERS-01| 상태 유지 | 새로고침 복구 | Refresh 후 데이터 유지 | 페이지 새로고침 후 노드 위치, 엣지, 카운터(Q-ID) 유지 확인 | **PASS** | localStorage 연동 완료 |
| 9 | TC-VAL-DEEP-01 | 심층 검증 | 자기 참조 방지 | Self-loop 차단 | 노드 출력을 자기 자신의 입력으로 연결 시 차단 및 Toast 표시 | **PASS** | "자기 자신에게 연결 불가" |
| 10 | TC-VAL-DEEP-02 | 심층 검증 | 순환 참조 탐색 | Cycle Detection | A->B, B->A와 같은 순환 연결 시도 시 BFS 알고리즘으로 차단 | **PASS** | "순환 참조 발생" Toast |
| 11 | TC-VAL-DEEP-03 | 심층 검증 | 미연결 포트 탐지 | Unlinked Port Detection | 필수 출력(옵션, default) 미연결 시 저장 버튼 차단 및 경고 | **PASS** | Header 저장 로직 연동 |
| 12 | TC-INTEG-001 | 무결성 | JSON 내보내기 | 스키마 준수 및 정합성 | 내보낸 JSON의 득점(Score), 분기 logic 정합성 검증 | **PASS** | localStorage snapshot 일치 |

---

## 특이 사항 및 개선 사항
- **포트 설정**: 시스템 충돌 방지를 위해 기본 포트를 `6000`에서 `5000`으로 변경함.
- **안정성**: `useHistoryStore`에서 revoked proxy 문제를 해결하기 위해 Immer를 제거하고 순수 객체 deep clone 방식으로 전환하여 Undo/Redo의 원자성을 확보함.
- **성능**: 50개 노드 환경에서도 60fps에 근접한 안정적인 성능을 보여줌.
