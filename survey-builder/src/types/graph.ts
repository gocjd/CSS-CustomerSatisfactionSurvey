// types/graph.ts - React Flow 그래프 관련 타입 정의

import type { Node, Edge, XYPosition } from '@xyflow/react';
import type { Question } from './question';

// 질문 노드 데이터
export interface QuestionNodeData extends Record<string, unknown> {
  question: Question;
  isSelected: boolean;
  hasError: boolean;
  errorMessages: string[];
}

// 시작 노드 데이터
export interface StartNodeData extends Record<string, unknown> {
  label: string;
  hasError?: boolean;
  errorMessages?: string[];
}

// 종료 노드 데이터
export interface EndNodeData extends Record<string, unknown> {
  label: string;
  hasError?: boolean;
  errorMessages?: string[];
}

// 섹션 노드 데이터 (그룹화용)
export interface SectionNodeData extends Record<string, unknown> {
  sectionId: string;
  title: string;
  description: string;
}

// 노드 타입 정의
export type QuestionNode = Node<QuestionNodeData, 'question'>;
export type StartNode = Node<StartNodeData, 'start'>;
export type EndNode = Node<EndNodeData, 'end'>;
export type SectionNode = Node<SectionNodeData, 'section'>;

export type SurveyNode = QuestionNode | StartNode | EndNode | SectionNode;

// 엣지 데이터
export interface EdgeData extends Record<string, unknown> {
  condition?: string;
  label?: string;
}

export type SurveyEdge = Edge<EdgeData>;

// 그래프 전체 상태
export interface GraphState {
  nodes: SurveyNode[];
  edges: SurveyEdge[];
}

// 노드 생성 헬퍼
export function createQuestionNode(
  question: Question,
  position: XYPosition
): QuestionNode {
  return {
    id: question.questionId,
    type: 'question',
    position,
    data: {
      question,
      isSelected: false,
      hasError: false,
      errorMessages: [],
    },
  };
}

export function createStartNode(position: XYPosition = { x: 50, y: 200 }): StartNode {
  return {
    id: 'start',
    type: 'start',
    position,
    data: {
      label: '시작',
      hasError: false,
      errorMessages: [],
    },
    draggable: true,
  };
}

export function createEndNode(position: XYPosition = { x: 800, y: 200 }): EndNode {
  return {
    id: 'end',
    type: 'end',
    position,
    data: {
      label: '종료',
      hasError: false,
      errorMessages: [],
    },
    draggable: true,
  };
}

// 엣지 생성 헬퍼
export function createEdge(
  source: string,
  target: string,
  sourceHandle: string = 'output-default',
  targetHandle: string = 'input',
  condition?: string
): SurveyEdge {
  const id = condition
    ? `${source}-${condition}-${target}`
    : `${source}-${target}`;

  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'deletable',
    animated: false,
    data: condition ? { condition } : undefined,
  };
}

// 그래프 검증 에러 타입
export interface GraphError {
  type: 'loop' | 'orphan' | 'dangling' | 'missing_connection' | 'validation' | 'invalid_path';
  nodeId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: GraphError[];
}
