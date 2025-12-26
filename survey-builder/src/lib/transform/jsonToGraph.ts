// lib/transform/jsonToGraph.ts - JSON → Graph 변환

import type { XYPosition } from '@xyflow/react';
import type { Survey } from '@/types/survey';
import type { Question } from '@/types/question';
import type { QuestionNode, StartNode, EndNode, SurveyEdge } from '@/types';
import { createQuestionNode, createEdge } from '@/types';
import { autoLayout } from './autoLayout';
import { DEFAULT_SURVEY } from '@/types/survey';

export interface GraphData {
  nodes: (QuestionNode | StartNode | EndNode)[];
  edges: SurveyEdge[];
}

/**
 * Survey JSON을 React Flow 그래프로 변환
 */
export function jsonToGraph(survey: Survey): GraphData {
  const nodes: (QuestionNode | StartNode | EndNode)[] = [];
  const edges: SurveyEdge[] = [];

  // 질문 ID → 노드 ID 매핑
  const questionIdToNodeId = new Map<string, string>();

  // 1. Start 노드 생성
  const startNode: StartNode = {
    id: 'start',
    type: 'start',
    position: { x: 0, y: 0 },
    data: { label: '시작' },
    draggable: true,
    selectable: false,
    deletable: false,
  };
  nodes.push(startNode);

  // 2. End 노드 생성
  const endNode: EndNode = {
    id: 'end',
    type: 'end',
    position: { x: 0, y: 0 },
    data: { label: '종료' },
    draggable: true,
    selectable: false,
    deletable: false,
  };
  nodes.push(endNode);

  // 3. 질문 노드들 생성
  survey.questions.forEach((question, index) => {
    const nodeId = `question-${question.questionId}`;
    questionIdToNodeId.set(question.questionId, nodeId);

    // 임시 위치 (나중에 autoLayout으로 재배치)
    const position: XYPosition = {
      x: 300,
      y: 100 + index * 200,
    };

    const questionNode = createQuestionNode(question, position);
    questionNode.id = nodeId;
    nodes.push(questionNode);
  });

  // 4. 엣지 생성
  // Start → 첫 번째 질문
  if (survey.questions.length > 0) {
    const firstQuestionId = survey.questions[0].questionId;
    const firstNodeId = questionIdToNodeId.get(firstQuestionId);
    if (firstNodeId) {
      edges.push(
        createEdge('start', firstNodeId, 'output-default', 'input')
      );
    }
  } else {
    // 질문이 없으면 Start → End
    edges.push(createEdge('start', 'end', 'output-default', 'input'));
  }

  // 질문 간 연결
  survey.questions.forEach((question, index) => {
    const sourceNodeId = questionIdToNodeId.get(question.questionId);
    if (!sourceNodeId) return;

    const { nextQuestion } = question;

    // 조건 분기 (Record<string, string>)
    if (typeof nextQuestion === 'object' && nextQuestion !== null) {
      for (const [optionValue, targetQuestionId] of Object.entries(nextQuestion)) {
        const targetNodeId = targetQuestionId === 'END'
          ? 'end'
          : questionIdToNodeId.get(targetQuestionId);

        if (targetNodeId) {
          edges.push(
            createEdge(
              sourceNodeId,
              targetNodeId,
              `output-${optionValue}`,
              'input'
            )
          );
        }
      }
    }
    // 단일 다음 질문 (string)
    else if (typeof nextQuestion === 'string') {
      const targetNodeId = questionIdToNodeId.get(nextQuestion);
      if (targetNodeId) {
        edges.push(
          createEdge(sourceNodeId, targetNodeId, 'output-default', 'input')
        );
      }
    }
    // null이거나 마지막 질문 → End 노드로 연결
    else {
      edges.push(
        createEdge(sourceNodeId, 'end', 'output-default', 'input')
      );
    }
  });

  // 5. 자동 레이아웃 적용
  const layoutedGraph = autoLayout(nodes, edges);

  return layoutedGraph;
}

/**
 * 단일 질문을 노드로 변환
 */
export function questionToNode(
  question: Question,
  position: XYPosition
): QuestionNode {
  return createQuestionNode(question, position);
}

/**
 * 빈 Survey 템플릿 생성
 */
export function createEmptySurvey(): Survey {
  return {
    ...DEFAULT_SURVEY,
    surveyId: `survey-${Date.now()}`,
    sections: [],
    questions: [],
  };
}
