# AI(MCP) 설문 자동 생성 – Prompt & JSON 출력 규격

> 본 문서는 **AI(MCP)를 활용하여 설문지를 자동 생성**하기 위한
> Prompt 설계 원칙과 **반드시 준수해야 할 JSON 출력 규격**을 정의한다.
>
> 이 문서는 Survey Builder 통합 설계 문서의 **보조·연계 문서**이며,
> AI 출력 결과는 **100% Builder에 로딩 가능**해야 한다.

---

## 1. 문서의 목적

본 문서의 목적은 다음과 같다.

- AI가 생성한 설문 결과를 **사람의 수정 없이 Builder에 즉시 로딩**
- Prompt가 바뀌어도 JSON 구조는 **절대 흔들리지 않도록 규격 고정**
- MCP(Server Trigger / Tool)에서 재사용 가능한 **표준 계약서** 제공

---

## 2. AI 설문 생성의 기본 철학

### 2.1 역할 분리 원칙

| 역할 | 책임 |
|----|----|
| AI | 설문 논리·문항 내용 생성 |
| JSON Schema | 구조적 진실의 원천 |
| Builder | 시각화 및 편집 |

> AI는 **구조를 상상하지 않는다**.
> AI는 **정해진 구조에 내용을 채운다**.

---

## 3. AI Prompt 설계 원칙

### 3.1 Prompt는 반드시 다음 정보를 포함해야 한다

1. 설문 목적
2. 대상 사용자
3. 질문 개수 또는 범위
4. 질문 타입 제약
5. 출력 형식(JSON) 강제

---

## 4. 표준 AI Prompt 템플릿

### 4.1 System Prompt (고정)

```
너는 고객만족도 설문지를 생성하는 전문가이다.
출력은 반드시 JSON만 반환해야 하며,
아래에 정의된 JSON Schema를 절대 벗어나면 안 된다.
설명, 주석, 마크다운, 자연어 문장은 출력하지 마라.
```

---

### 4.2 User Prompt (가변)

```
설문 목적: {{survey_goal}}
설문 대상: {{target_user}}
설문 맥락: {{context}}

요구사항:
- 질문 개수: {{question_count}}
- 반드시 포함할 질문 유형: {{required_types}}
- 제외할 질문 유형: {{excluded_types}}

출력 규칙:
- 반드시 아래 JSON 출력 규격을 따를 것
- questionId는 Q1부터 순차 증가
- nextQuestion 흐름이 단절되지 않도록 구성
```

---

## 5. AI 출력 최상위 JSON 구조

```json
{
  "meta": {
    "title": "고객 만족도 조사",
    "description": "AI 자동 생성 설문",
    "version": "1.0",
    "createdBy": "AI_MCP"
  },
  "sections": [],
  "questions": []
}
```

---

## 6. Section JSON 규격

```json
{
  "sectionId": "SEC1",
  "title": "기본 정보",
  "order": 1
}
```

| 필드 | 필수 | 설명 |
|----|----|----|
| sectionId | Y | 고유 ID |
| title | Y | 섹션 제목 |
| order | Y | 표시 순서 |

---

## 7. Question JSON 규격 (공통)

```json
{
  "questionId": "Q1",
  "sectionId": "SEC1",
  "questionType": "multiple_choice",
  "promptType": "text_prompt",
  "title": "연령대",
  "prompt": "귀하의 연령대를 선택해 주세요.",
  "required": true,
  "importance": "medium",
  "nextQuestion": "Q2"
}
```

---

## 8. Question 타입별 출력 규칙 요약

### 8.1 multiple_choice

- options 필수
- min/maxSelections 명시

```json
"options": [
  { "value": "1", "label": "매우 불만족", "score": 1 }
]
```

---

### 8.2 likert_scale

- displayType = likert_scale
- options는 좌→우 순서

---

### 8.3 text_opinion

- placeholder 포함
- validation 필수

---

### 8.4 voice_opinion

- audio.maxRecordingTime 필수
- validation.minDuration 필수

---

## 9. 분기(Branch) 생성 규칙

### 9.1 단순 분기

```json
"nextQuestion": {
  "1": "Q3",
  "2": "Q4"
}
```

### 9.2 규칙

- 모든 option value는 nextQuestion key와 일치해야 함
- 순환 참조 금지

---

## 10. AI 출력 Validation 체크리스트

MCP 수신 후 반드시 다음 검증을 수행한다.

- [ ] JSON 파싱 가능 여부
- [ ] questionId 중복 없음
- [ ] nextQuestion 단절 없음
- [ ] sectionId 존재 여부
- [ ] Question 타입별 필수 필드 포함

---

## 11. Builder 로딩 규칙

1. meta → BuilderHeader
2. sections → Section 생성
3. questions → Canvas Node 생성
4. nextQuestion → Edge 자동 연결

---

## 12. 실패 사례 (금지)

- 자연어 설명 포함
- questionId 누락
- 배열 대신 객체 출력
- JSON 외 텍스트 출력

---

## 13. 최종 결론

> **AI는 설문을 "작성"하지 않는다.
> AI는 설문을 "조립"한다.**

이 문서는 AI(MCP)와 Survey Builder 사이의
**절대적인 계약(Contract)** 이다.

---

(끝)

