// lib/transform/graphToJson.ts - Graph → JSON 변환

import type { Survey, Section, DEFAULT_SURVEY } from '@/types/survey';
import type { Question } from '@/types/question';
import type { QuestionNode, StartNode, EndNode, SurveyEdge } from '@/types';

type SurveyNode = QuestionNode | StartNode | EndNode;

/**
 * React Flow 그래프를 Survey JSON으로 변환
 */
export function graphToJson(
  nodes: SurveyNode[],
  edges: SurveyEdge[],
  existingSurvey?: Partial<Survey>
): Survey {
  // 질문 노드만 필터링
  const questionNodes = nodes.filter(
    (n): n is QuestionNode => n.type === 'question'
  );

  // 노드 ID → 질문 ID 매핑
  const nodeIdToQuestionId = new Map<string, string>();
  for (const node of questionNodes) {
    nodeIdToQuestionId.set(node.id, node.data.question.questionId);
  }

  // 질문 순서 결정 (Y 좌표 기준)
  const sortedQuestionNodes = [...questionNodes].sort(
    (a, b) => a.position.y - b.position.y
  );

  // 질문 목록 생성
  const questions: Question[] = sortedQuestionNodes.map((node) => {
    const question = { ...node.data.question };

    // 분기 정보 추출
    const outgoingEdges = edges.filter((e) => e.source === node.id);

    // 다음 질문 결정
    if (outgoingEdges.length === 0) {
      // 연결이 없으면 null
      question.nextQuestion = null;
    } else if (outgoingEdges.length === 1) {
      // 단일 연결
      const edge = outgoingEdges[0];
      const targetQuestionId = edge.target === 'end'
        ? null
        : nodeIdToQuestionId.get(edge.target) || null;
      question.nextQuestion = targetQuestionId;
    } else {
      // 다중 연결 (조건 분기)
      const nextQuestionMap: Record<string, string> = {};

      for (const edge of outgoingEdges) {
        if (edge.sourceHandle?.startsWith('output-')) {
          const optionValue = edge.sourceHandle.replace('output-', '');
          const targetQuestionId = edge.target === 'end'
            ? 'END'
            : nodeIdToQuestionId.get(edge.target);

          if (targetQuestionId && optionValue !== 'default') {
            nextQuestionMap[optionValue] = targetQuestionId;
          }
        }
      }

      // 분기가 있으면 Record, 없으면 기본 연결
      if (Object.keys(nextQuestionMap).length > 0) {
        question.nextQuestion = nextQuestionMap;
      } else {
        const defaultEdge = outgoingEdges.find(e =>
          e.sourceHandle === 'output-default' || e.sourceHandle === 'output'
        );
        if (defaultEdge) {
          question.nextQuestion = defaultEdge.target === 'end'
            ? null
            : nodeIdToQuestionId.get(defaultEdge.target) || null;
        }
      }
    }

    return question;
  });

  // 섹션 생성 (기존 섹션이 있으면 유지, 없으면 기본 섹션 생성)
  const sections: Section[] = existingSurvey?.sections || [{
    sectionId: 'section-default',
    title: '기본 섹션',
    description: '',
    questionIds: questions.map(q => q.questionId),
    required: true,
  }];

  // Survey 객체 생성
  const survey: Survey = {
    surveyId: existingSurvey?.surveyId || `survey-${Date.now()}`,
    version: existingSurvey?.version || '1.0',
    title: existingSurvey?.title || '새 설문',
    description: existingSurvey?.description || '',
    language: existingSurvey?.language || 'ko',
    supportedLanguages: existingSurvey?.supportedLanguages || ['ko'],
    creator: existingSurvey?.creator || {
      name: '',
      department: '',
      email: '',
    },
    schedule: existingSurvey?.schedule || {
      date: { start: '', end: '' },
      time: { start: '09:00:00', end: '18:00:00' },
      offtime: [],
      timeZone: 'Asia/Seoul',
    },
    settings: existingSurvey?.settings || {
      allowAnonymous: true,
      allowRevision: true,
      estimatedDuration: 10,
      showProgress: true,
      randomizeQuestions: false,
      requireAllQuestions: false,
      analytics: {
        trackingEnabled: false,
        collectMetadata: [],
      },
    },
    sections,
    questions,
  };

  return survey;
}

/**
 * 단일 질문 노드에서 질문 데이터 추출
 */
export function nodeToQuestion(node: QuestionNode): Question {
  return { ...node.data.question };
}

/**
 * 첫 번째 질문 ID 찾기 (Start 노드에서 연결된)
 */
export function findFirstQuestionId(
  edges: SurveyEdge[],
  nodes: SurveyNode[]
): string | null {
  const startEdge = edges.find((e) => e.source === 'start');
  if (!startEdge) return null;

  const targetNode = nodes.find((n) => n.id === startEdge.target);
  if (!targetNode || targetNode.type !== 'question') return null;

  return (targetNode as QuestionNode).data.question.questionId;
}

/**
 * 질문 순서 재계산
 */
export function recalculateQuestionOrders(
  nodes: QuestionNode[]
): Map<string, number> {
  const orderMap = new Map<string, number>();

  const sortedNodes = [...nodes].sort(
    (a, b) => a.position.y - b.position.y
  );

  sortedNodes.forEach((node, index) => {
    orderMap.set(node.data.question.questionId, index);
  });

  return orderMap;
}
