// lib/validation/graphValidator.ts - 그래프 검증기

import type { Node, Edge } from '@xyflow/react';
import type { QuestionNode, StartNode, EndNode, SurveyEdge } from '@/types';

export interface ValidationError {
  type: 'loop' | 'orphan' | 'dangling' | 'missing_end' | 'duplicate_id' | 'invalid_connection';
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

type SurveyNode = QuestionNode | StartNode | EndNode;

/**
 * 그래프 전체 검증
 */
export function validateGraph(
  nodes: SurveyNode[],
  edges: SurveyEdge[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. 루프 감지
  const loopErrors = detectLoops(nodes, edges);
  errors.push(...loopErrors);

  // 2. 고아 노드 감지
  const orphanErrors = detectOrphans(nodes, edges);
  warnings.push(...orphanErrors);

  // 3. 댕글링 포트 감지
  const danglingErrors = detectDanglingPorts(nodes, edges);
  warnings.push(...danglingErrors);

  // 4. End 노드 도달 가능성 검증
  const endReachabilityErrors = validateEndReachability(nodes, edges);
  errors.push(...endReachabilityErrors);

  // 5. 중복 ID 검증
  const duplicateErrors = detectDuplicateIds(nodes);
  errors.push(...duplicateErrors);

  // 6. 잘못된 연결 검증
  const connectionErrors = validateConnections(nodes, edges);
  errors.push(...connectionErrors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * DFS를 사용한 루프(순환) 감지
 */
export function detectLoops(
  nodes: SurveyNode[],
  edges: SurveyEdge[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const adjacencyList = buildAdjacencyList(nodes, edges);

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        if (dfs(neighborId, [...path, nodeId])) {
          return true;
        }
      } else if (recursionStack.has(neighborId)) {
        // 루프 발견
        const loopPath = [...path, nodeId, neighborId];
        errors.push({
          type: 'loop',
          nodeId: neighborId,
          message: `순환 감지: ${loopPath.join(' → ')}`,
          severity: 'error',
        });
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return errors;
}

/**
 * Start 노드에서 도달할 수 없는 고아 노드 감지
 */
export function detectOrphans(
  nodes: SurveyNode[],
  edges: SurveyEdge[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const startNode = nodes.find((n) => n.type === 'start');

  if (!startNode) {
    return errors;
  }

  const reachable = new Set<string>();
  const queue: string[] = [startNode.id];
  const adjacencyList = buildAdjacencyList(nodes, edges);

  // BFS로 도달 가능한 노드 탐색
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (reachable.has(nodeId)) continue;
    reachable.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighborId of neighbors) {
      if (!reachable.has(neighborId)) {
        queue.push(neighborId);
      }
    }
  }

  // Start, End 노드를 제외한 도달 불가능 노드 검출
  for (const node of nodes) {
    if (
      node.type === 'question' &&
      !reachable.has(node.id)
    ) {
      errors.push({
        type: 'orphan',
        nodeId: node.id,
        message: `고아 노드: "${(node as QuestionNode).data.question.title}"는 시작점에서 도달할 수 없습니다`,
        severity: 'warning',
      });
    }
  }

  return errors;
}

/**
 * 연결되지 않은 출력 포트 감지
 */
export function detectDanglingPorts(
  nodes: SurveyNode[],
  edges: SurveyEdge[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const connectedHandles = new Set<string>();

  // 연결된 핸들 수집
  for (const edge of edges) {
    connectedHandles.add(`${edge.source}-${edge.sourceHandle}`);
    connectedHandles.add(`${edge.target}-${edge.targetHandle}`);
  }

  for (const node of nodes) {
    if (node.type === 'question') {
      const questionNode = node as QuestionNode;
      const question = questionNode.data.question;

      // 기본 출력 포트 확인
      const defaultHandle = `${node.id}-output-default`;
      const hasDefaultConnection = connectedHandles.has(defaultHandle);

      // 조건 분기 확인 (nextQuestion이 Record인 경우)
      const hasConditionalBranching =
        typeof question.nextQuestion === 'object' &&
        question.nextQuestion !== null;

      if (!hasDefaultConnection && !hasConditionalBranching) {
        errors.push({
          type: 'dangling',
          nodeId: node.id,
          message: `미연결 포트: "${question.title}"의 출력이 연결되지 않았습니다`,
          severity: 'warning',
        });
      }

      // 옵션별 출력 포트 확인 (조건 분기 설정된 경우)
      if (hasConditionalBranching && question.options) {
        for (const option of question.options) {
          const optionHandle = `${node.id}-output-${option.value}`;
          // nextQuestion에 해당 옵션 값이 있는지 확인
          const nextQuestionMap = question.nextQuestion as Record<string, string>;
          if (nextQuestionMap[option.value] && !connectedHandles.has(optionHandle)) {
            errors.push({
              type: 'dangling',
              nodeId: node.id,
              message: `미연결 옵션 포트: "${option.label}" 옵션의 분기가 설정되었으나 연결되지 않았습니다`,
              severity: 'warning',
            });
          }
        }
      }
    }
  }

  return errors;
}

/**
 * End 노드 도달 가능성 검증
 */
export function validateEndReachability(
  nodes: SurveyNode[],
  edges: SurveyEdge[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const endNode = nodes.find((n) => n.type === 'end');

  if (!endNode) {
    errors.push({
      type: 'missing_end',
      message: '종료 노드가 없습니다',
      severity: 'error',
    });
    return errors;
  }

  // 역방향 그래프 구축
  const reverseAdjList = new Map<string, string[]>();
  for (const node of nodes) {
    reverseAdjList.set(node.id, []);
  }
  for (const edge of edges) {
    const sources = reverseAdjList.get(edge.target) || [];
    sources.push(edge.source);
    reverseAdjList.set(edge.target, sources);
  }

  // End 노드에서 역방향으로 도달 가능한 노드 탐색
  const reachableFromEnd = new Set<string>();
  const queue: string[] = [endNode.id];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (reachableFromEnd.has(nodeId)) continue;
    reachableFromEnd.add(nodeId);

    const sources = reverseAdjList.get(nodeId) || [];
    for (const sourceId of sources) {
      if (!reachableFromEnd.has(sourceId)) {
        queue.push(sourceId);
      }
    }
  }

  // 질문 노드 중 End에 도달할 수 없는 노드 검출
  for (const node of nodes) {
    if (
      node.type === 'question' &&
      !reachableFromEnd.has(node.id)
    ) {
      errors.push({
        type: 'missing_end',
        nodeId: node.id,
        message: `종료점 미도달: "${(node as QuestionNode).data.question.title}"에서 종료점에 도달할 수 없습니다`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * 중복 ID 감지
 */
export function detectDuplicateIds(
  nodes: SurveyNode[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Map<string, string>();

  for (const node of nodes) {
    if (node.type === 'question') {
      const questionId = (node as QuestionNode).data.question.questionId;
      if (seenIds.has(questionId)) {
        errors.push({
          type: 'duplicate_id',
          nodeId: node.id,
          message: `중복 ID: "${questionId}"가 여러 질문에서 사용되고 있습니다`,
          severity: 'error',
        });
      } else {
        seenIds.set(questionId, node.id);
      }
    }
  }

  return errors;
}

/**
 * 잘못된 연결 검증
 */
export function validateConnections(
  nodes: SurveyNode[],
  edges: SurveyEdge[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode) {
      errors.push({
        type: 'invalid_connection',
        edgeId: edge.id,
        message: `잘못된 연결: 소스 노드 "${edge.source}"를 찾을 수 없습니다`,
        severity: 'error',
      });
      continue;
    }

    if (!targetNode) {
      errors.push({
        type: 'invalid_connection',
        edgeId: edge.id,
        message: `잘못된 연결: 타겟 노드 "${edge.target}"를 찾을 수 없습니다`,
        severity: 'error',
      });
      continue;
    }

    // End 노드에서 나가는 연결 불가
    if (sourceNode.type === 'end') {
      errors.push({
        type: 'invalid_connection',
        edgeId: edge.id,
        message: '잘못된 연결: 종료 노드에서 나가는 연결은 허용되지 않습니다',
        severity: 'error',
      });
    }

    // Start 노드로 들어오는 연결 불가
    if (targetNode.type === 'start') {
      errors.push({
        type: 'invalid_connection',
        edgeId: edge.id,
        message: '잘못된 연결: 시작 노드로 들어오는 연결은 허용되지 않습니다',
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * 인접 리스트 구축 헬퍼
 */
function buildAdjacencyList(
  nodes: SurveyNode[],
  edges: SurveyEdge[]
): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();

  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }

  for (const edge of edges) {
    const sources = adjacencyList.get(edge.source) || [];
    sources.push(edge.target);
    adjacencyList.set(edge.source, sources);
  }

  return adjacencyList;
}

/**
 * 실시간 단일 노드 검증
 */
export function validateNode(
  node: QuestionNode
): ValidationError[] {
  const errors: ValidationError[] = [];
  const question = node.data.question;

  // 필수 필드 검증
  if (!question.title?.trim()) {
    errors.push({
      type: 'invalid_connection',
      nodeId: node.id,
      message: '질문 제목은 필수입니다',
      severity: 'error',
    });
  }

  if (!question.prompt?.trim()) {
    errors.push({
      type: 'invalid_connection',
      nodeId: node.id,
      message: '프롬프트 텍스트는 필수입니다',
      severity: 'error',
    });
  }

  // 객관식 질문의 옵션 검증
  if (question.questionType === 'multiple_choice') {
    if (!question.options || question.options.length < 2) {
      errors.push({
        type: 'invalid_connection',
        nodeId: node.id,
        message: '객관식 질문은 최소 2개의 옵션이 필요합니다',
        severity: 'error',
      });
    } else {
      // 옵션 값 중복 검사
      const optionValues = new Set<string>();
      for (const option of question.options) {
        if (optionValues.has(option.value)) {
          errors.push({
            type: 'duplicate_id',
            nodeId: node.id,
            message: `옵션 값 "${option.value}"가 중복되었습니다`,
            severity: 'error',
          });
        }
        optionValues.add(option.value);

        if (!option.label?.trim()) {
          errors.push({
            type: 'invalid_connection',
            nodeId: node.id,
            message: '옵션 라벨은 필수입니다',
            severity: 'error',
          });
        }
      }
    }
  }

  return errors;
}
