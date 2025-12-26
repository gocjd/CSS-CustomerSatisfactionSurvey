# CSS (Customer Satisfaction Survey) Builder

고객 만족도 조사를 위한 시각적 설문 빌더 - Node 기반 Visual Builder

## 📋 프로젝트 개요

CSS Survey Builder는 JSON 스키마 기반의 고객 만족도 조사(Customer Satisfaction Survey)를 시각적으로 설계하고 관리할 수 있는 웹 기반 도구입니다.

### 주요 기능

- ✅ **드래그 & 드롭 노드 편집기**: 질문을 노드로 표현하고 시각적으로 연결
- ✅ **실시간 미리보기**: 설문 흐름을 시각적으로 확인
- ✅ **분기 로직 지원**: 응답에 따른 동적 분기 설정
- ✅ **JSON Import/Export**: 기존 설문 불러오기 및 저장
- ✅ **Undo/Redo**: 작업 히스토리 관리
- ✅ **실시간 검증**: 설문 구조 유효성 검사
- ✅ **다크 모드 지원**: 사용자 선호도에 맞는 테마

## 🏗️ 프로젝트 구조

```
CSS(CustomerSatisfactionSurvey)/
├── survey-builder/          # Next.js 기반 Survey Builder 애플리케이션
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React 컴포넌트
│   │   │   └── builder/    # Survey Builder 관련 컴포넌트
│   │   ├── stores/         # Zustand 상태 관리
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── lib/            # 유틸리티 함수
│   └── public/             # 정적 파일
└── docs/                   # 문서 및 샘플 데이터
    ├── *.json              # 샘플 설문 JSON 파일
    └── *.md                # 개발 문서
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/CSS-CustomerSatisfactionSurvey.git
cd CSS-CustomerSatisfactionSurvey/survey-builder

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버가 [http://localhost:5000](http://localhost:5000)에서 실행됩니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드된 앱 실행
npm start
```

## 🛠️ 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **UI 라이브러리**: React 19
- **플로우 편집기**: React Flow (@xyflow/react)
- **상태 관리**: Zustand (with persist middleware)
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **드래그 앤 드롭**: @dnd-kit
- **아이콘**: Lucide React
- **유효성 검사**: Zod

## 📖 사용 방법

### 1. 새 설문 만들기

1. 왼쪽 팔레트에서 질문 타입 선택 (객관식, 텍스트 의견, 음성 의견)
2. 캔버스로 드래그하여 질문 노드 생성
3. 노드 클릭하여 속성 편집 패널에서 상세 정보 입력

### 2. 질문 연결하기

1. 질문 노드의 출력 포트를 다른 질문의 입력 포트로 드래그
2. 객관식 질문의 경우 옵션별 분기 설정 가능

### 3. 설문 저장 및 불러오기

- **저장**: 상단 "저장" 또는 "다른 이름으로 저장" 버튼 클릭
- **불러오기**: "불러오기" 버튼으로 기존 JSON 파일 선택

## 📝 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.

## 📧 문의

프로젝트 관련 문의사항은 Issues 탭을 이용해주세요.

---

**버전**: v1.0.0  
**최초 릴리스**: 2025-12-26
