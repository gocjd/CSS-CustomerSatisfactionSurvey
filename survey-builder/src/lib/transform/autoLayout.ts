// lib/transform/autoLayout.ts - 자동 레이아웃 (Dagre 기반)

import type { QuestionNode, StartNode, EndNode, SurveyEdge } from '@/types';

type SurveyNode = QuestionNode | StartNode | EndNode;

interface LayoutOptions {
  direction: 'TB' | 'LR'; // Top-Bottom or Left-Right
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 280,
  nodeHeight: 120,
  horizontalSpacing: 100,
  verticalSpacing: 80,
};

interface GraphData {
  nodes: SurveyNode[];
  edges: SurveyEdge[];
}

/**
 * 자동 레이아웃 적용 (간단한 계층 레이아웃)
 * Dagre 라이브러리 없이 기본 계층 레이아웃 구현
 */
export function autoLayout(
  nodes: SurveyNode[],
  edges: SurveyEdge[],
  options: Partial<LayoutOptions> = {}
): GraphData {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 인접 리스트 구축
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // 위상 정렬로 레벨 결정
  const levels = new Map<string, number>();
  const queue: string[] = [];

  // Start 노드 찾기
  const startNode = nodes.find((n) => n.type === 'start');
  if (startNode) {
    queue.push(startNode.id);
    levels.set(startNode.id, 0);
  }

  // in-degree가 0인 노드들도 시작점으로 추가
  for (const node of nodes) {
    if (inDegree.get(node.id) === 0 && !levels.has(node.id)) {
      queue.push(node.id);
      levels.set(node.id, 0);
    }
  }

  // BFS로 레벨 할당
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const currentLevel = levels.get(nodeId) || 0;
    const neighbors = adjacencyList.get(nodeId) || [];

    for (const neighborId of neighbors) {
      const existingLevel = levels.get(neighborId);
      const newLevel = currentLevel + 1;

      if (existingLevel === undefined || newLevel > existingLevel) {
        levels.set(neighborId, newLevel);
      }

      const newInDegree = (inDegree.get(neighborId) || 1) - 1;
      inDegree.set(neighborId, newInDegree);

      if (newInDegree <= 0 || !levels.has(neighborId)) {
        if (!queue.includes(neighborId)) {
          queue.push(neighborId);
        }
      }
    }
  }

  // 레벨이 설정되지 않은 노드 처리 (고아 노드)
  let maxLevel = 0;
  for (const level of levels.values()) {
    maxLevel = Math.max(maxLevel, level);
  }

  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, maxLevel + 1);
    }
  }

  // 레벨별 노드 그룹화
  const levelGroups = new Map<number, SurveyNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) || 0;
    const group = levelGroups.get(level) || [];
    group.push(node);
    levelGroups.set(level, group);
  }

  // 노드 위치 계산
  const layoutedNodes = nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const nodesInLevel = levelGroups.get(level) || [node];
    const indexInLevel = nodesInLevel.indexOf(node);
    const totalInLevel = nodesInLevel.length;

    // 중앙 정렬
    const totalWidth = totalInLevel * opts.nodeWidth + (totalInLevel - 1) * opts.horizontalSpacing;
    const startX = -totalWidth / 2;

    let x: number;
    let y: number;

    if (opts.direction === 'TB') {
      x = startX + indexInLevel * (opts.nodeWidth + opts.horizontalSpacing) + opts.nodeWidth / 2;
      y = level * (opts.nodeHeight + opts.verticalSpacing);
    } else {
      x = level * (opts.nodeWidth + opts.horizontalSpacing);
      y = startX + indexInLevel * (opts.nodeHeight + opts.verticalSpacing) + opts.nodeHeight / 2;
    }

    return {
      ...node,
      position: { x, y },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

/**
 * 선택된 노드들만 자동 정렬
 */
export function autoLayoutSelected(
  allNodes: SurveyNode[],
  selectedNodeIds: string[],
  edges: SurveyEdge[],
  options: Partial<LayoutOptions> = {}
): SurveyNode[] {
  const selectedNodes = allNodes.filter((n) => selectedNodeIds.includes(n.id));
  const relevantEdges = edges.filter(
    (e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
  );

  const { nodes: layoutedSelected } = autoLayout(selectedNodes, relevantEdges, options);

  // 선택된 노드의 최소 위치 계산
  const minX = Math.min(...selectedNodes.map((n) => n.position.x));
  const minY = Math.min(...selectedNodes.map((n) => n.position.y));

  // 레이아웃된 노드를 원래 영역으로 이동
  const layoutedMinX = Math.min(...layoutedSelected.map((n) => n.position.x));
  const layoutedMinY = Math.min(...layoutedSelected.map((n) => n.position.y));

  const offsetX = minX - layoutedMinX;
  const offsetY = minY - layoutedMinY;

  const adjustedNodes = layoutedSelected.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));

  // 원래 노드 배열에 병합
  const nodeMap = new Map(adjustedNodes.map((n) => [n.id, n]));
  return allNodes.map((node) => nodeMap.get(node.id) || node);
}

/**
 * 그리드에 스냅
 */
export function snapToGrid(
  position: { x: number; y: number },
  gridSize: number = 20
): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * 노드 정렬 (수평/수직)
 */
export function alignNodes(
  nodes: SurveyNode[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): SurveyNode[] {
  if (nodes.length < 2) return nodes;

  let targetValue: number;

  switch (alignment) {
    case 'left':
      targetValue = Math.min(...nodes.map((n) => n.position.x));
      return nodes.map((n) => ({ ...n, position: { ...n.position, x: targetValue } }));

    case 'center':
      targetValue = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
      return nodes.map((n) => ({ ...n, position: { ...n.position, x: targetValue } }));

    case 'right':
      targetValue = Math.max(...nodes.map((n) => n.position.x));
      return nodes.map((n) => ({ ...n, position: { ...n.position, x: targetValue } }));

    case 'top':
      targetValue = Math.min(...nodes.map((n) => n.position.y));
      return nodes.map((n) => ({ ...n, position: { ...n.position, y: targetValue } }));

    case 'middle':
      targetValue = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length;
      return nodes.map((n) => ({ ...n, position: { ...n.position, y: targetValue } }));

    case 'bottom':
      targetValue = Math.max(...nodes.map((n) => n.position.y));
      return nodes.map((n) => ({ ...n, position: { ...n.position, y: targetValue } }));
  }
}

/**
 * 노드 균등 분배
 */
export function distributeNodes(
  nodes: SurveyNode[],
  direction: 'horizontal' | 'vertical',
  nodeSize: number = 280
): SurveyNode[] {
  if (nodes.length < 3) return nodes;

  const sortedNodes = [...nodes].sort((a, b) =>
    direction === 'horizontal'
      ? a.position.x - b.position.x
      : a.position.y - b.position.y
  );

  const first = sortedNodes[0];
  const last = sortedNodes[sortedNodes.length - 1];

  const startPos = direction === 'horizontal' ? first.position.x : first.position.y;
  const endPos = direction === 'horizontal' ? last.position.x : last.position.y;
  const totalSpace = endPos - startPos;
  const spacing = totalSpace / (nodes.length - 1);

  return sortedNodes.map((node, index) => ({
    ...node,
    position: {
      x: direction === 'horizontal' ? startPos + index * spacing : node.position.x,
      y: direction === 'vertical' ? startPos + index * spacing : node.position.y,
    },
  }));
}
