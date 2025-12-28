'use client';

// components/builder/canvas/CanvasArea.tsx - 메인 캔버스 영역

import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  type XYPosition,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeMouseHandler,
  BackgroundVariant,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes/nodeTypes';
import { useSurveyStore, useSurveyActions } from '@/stores';
import { useUIStore, useUIActions } from '@/stores';
import { useHistoryActions } from '@/stores';
import { cn } from '@/lib/utils';
import type { SurveyNode, SurveyEdge, QuestionNode } from '@/types';
import { CanvasControls } from './CanvasControls';
import { ContextMenu } from './ContextMenu';
import { DeletableEdge } from './edges/DeletableEdge';
import { MiniMapNode } from './MiniMapNode';
import { DraggableMiniMap } from './DraggableMiniMap';

const edgeTypes = {
  deletable: DeletableEdge,
};

// 커스텀 엣지 스타일
const defaultEdgeOptions = {
  type: 'deletable',
  style: {
    strokeWidth: 2,
    stroke: '#94a3b8',
  },
  markerEnd: {
    type: 'arrowclosed' as const,
    color: '#94a3b8',
  },
};

export function CanvasArea() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, screenToFlowPosition, setViewport } = useReactFlow();

  // Store
  const nodes = useSurveyStore((state) => state.nodes);
  const rawEdges = useSurveyStore((state) => state.edges);

  // Calculate offsets for edges with same source-target pairs
  const edges = rawEdges.map((edge) => {
    const sameTargetEdges = rawEdges.filter(
      (e) => e.source === edge.source && e.target === edge.target
    );

    if (sameTargetEdges.length > 1) {
      const edgeIndex = sameTargetEdges.findIndex((e) => e.id === edge.id);
      const totalEdges = sameTargetEdges.length;
      // Calculate offset: spread edges evenly (-1, -0.5, 0, 0.5, 1 for 5 edges)
      const offset = (edgeIndex - (totalEdges - 1) / 2) * 30;
      return { ...edge, data: { ...edge.data, offset } };
    }
    return edge;
  });
  const selectedNodeId = useSurveyStore((state) => state.selectedNodeId);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const selectedQuestionType = useUIStore((state) => state.selectedQuestionType);
  const contextMenu = useUIStore((state) => state.contextMenu);

  // Actions
  const surveyActions = useSurveyActions();
  const uiActions = useUIActions();
  const historyActions = useHistoryActions();

  // 초기 뷰 맞춤
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // 캔버스 데이터가 로드되고 컨테이너가 렌더링된 후 뷰 맞춤
    if (nodes.length > 0) {
      timer = setTimeout(() => {
        try {
          // viewport가 이미 NaN인 경우를 대비해 fitView 전에 좌표 유효성 체크는 ReactFlow가 내부적으로 수행함
          fitView({ padding: 0.2, duration: 400 });
        } catch (error) {
          console.warn('fitView failed on mount:', error);
        }
      }, 500); // 넉넉한 지연 시간으로 레이아웃 안정화 대기
    }
    return () => clearTimeout(timer);
  }, []); // 마운트 시 최초 1회만 실행

  // 노드 변경 핸들러
  const onNodesChange: OnNodesChange<SurveyNode> = useCallback(
    (changes) => {
      // 위치 변경 시 NaN 방어
      const sanitizedChanges = changes.map(change => {
        if (change.type === 'position' && change.position) {
          return {
            ...change,
            position: {
              x: isNaN(change.position.x) ? 0 : change.position.x,
              y: isNaN(change.position.y) ? 0 : change.position.y,
            }
          };
        }
        return change;
      });
      const updatedNodes = applyNodeChanges(sanitizedChanges, nodes) as SurveyNode[];
      surveyActions.setNodes(updatedNodes);

      // 위치 변경 시 히스토리 저장
      const hasPositionChange = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      );
      if (hasPositionChange) {
        historyActions.saveState(updatedNodes, edges);
      }
    },
    [nodes, edges, surveyActions, historyActions]
  );

  // 뷰포트 이동 핸들러 (NaN 보호)
  const onMove = useCallback((event: any, viewport: { x: number; y: number; zoom: number }) => {
    if (isNaN(viewport.x) || isNaN(viewport.y) || isNaN(viewport.zoom)) {
      console.warn('NaN Viewport detected and blocked', viewport);
      // NaN이 감지되면 즉시 기본값으로 리셋 시도 (React Flow 내부 상태 보호)
      setViewport({ x: 0, y: 0, zoom: 0.8 }, { duration: 0 });
    }
  }, [setViewport]);

  // 엣지 변경 핸들러
  const onEdgesChange: OnEdgesChange<SurveyEdge> = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, edges) as SurveyEdge[];
      surveyActions.setEdges(updatedEdges);
    },
    [edges, surveyActions]
  );

  // 연결 핸들러
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // 자기 자신으로의 연결 방지 (이미 어느정도 되어있으나 명시적으로 강화)
        if (connection.source === connection.target) {
          uiActions.showToast('자기 자신에게 연결할 수 없습니다.', 'warning');
          return;
        }

        // 현재 그래프 상태
        const state = useSurveyStore.getState();

        // 1. 중복 연결 방지 (이미 store에서 체크하지만 UI 피드백을 위해)
        const isDuplicate = state.edges.some(
          (e) =>
            e.source === connection.source &&
            e.sourceHandle === connection.sourceHandle
        );
        if (isDuplicate) {
          uiActions.showToast('이미 연결된 포트입니다.', 'warning');
          return;
        }

        // 2. 순환 참조 체크 (BFS)
        const hasCycle = (src: string, target: string): boolean => {
          const adj = new Map<string, string[]>();
          state.edges.forEach(e => {
            if (!adj.has(e.source)) adj.set(e.source, []);
            adj.get(e.source)!.push(e.target);
          });

          const queue = [target];
          const visited = new Set<string>();
          while (queue.length > 0) {
            const curr = queue.shift()!;
            if (curr === src) return true;
            if (visited.has(curr)) continue;
            visited.add(curr);
            (adj.get(curr) || []).forEach(next => queue.push(next));
          }
          return false;
        };

        if (hasCycle(connection.source, connection.target)) {
          uiActions.showToast('순환 참조가 발생하여 연결할 수 없습니다.', 'error');
          return;
        }

        surveyActions.addEdge(
          connection.source,
          connection.target,
          connection.sourceHandle || undefined,
          connection.targetHandle || undefined
        );

        surveyActions.setDirty(true);
      }
    },
    [surveyActions, uiActions]
  );

  // 노드 클릭 핸들러
  const onNodeClick: NodeMouseHandler<SurveyNode> = useCallback(
    (event, node) => {
      surveyActions.selectNode(node.id);

      // Question 노드인 경우 PropertyPanel 열기
      if (node.type === 'question') {
        uiActions.openPropertyPanel();
      }
    },
    [surveyActions, uiActions]
  );

  // 노드 더블클릭 핸들러
  const onNodeDoubleClick: NodeMouseHandler<SurveyNode> = useCallback(
    (event, node) => {
      if (node.type === 'question') {
        uiActions.openPropertyPanel();
        uiActions.setPropertyPanelTab('basic');
      }
    },
    [uiActions]
  );

  // 노드 우클릭 핸들러
  const onNodeContextMenu: NodeMouseHandler<SurveyNode> = useCallback(
    (event, node) => {
      event.preventDefault();
      if (node.type === 'question') {
        uiActions.openContextMenu(
          { x: event.clientX, y: event.clientY },
          node.id
        );
      }
    },
    [uiActions]
  );

  // 캔버스 빈 공간 클릭 핸들러
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const selectedQuestionType = useUIStore.getState().selectedQuestionType;

      // 선택된 질문 타입이 있으면 해당 위치에 노드 추가
      if (selectedQuestionType) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (isNaN(position.x) || isNaN(position.y)) {
          console.error('Calculated position is NaN, cannot add node.');
          return;
        }

        surveyActions.addQuestionNode(selectedQuestionType as any, position);
        surveyActions.setDirty(true);

        // 질문 타입 선택 해제
        uiActions.setSelectedQuestionType(null);
        uiActions.showToast('질문이 추가되었습니다.', 'success');
      } else {
        // 질문 타입이 선택되지 않았으면 설문 공통 설정 표시
        surveyActions.selectNode(null);
        uiActions.openPropertyPanel();
        uiActions.setPropertyPanelTab('basic');
      }
    },
    [screenToFlowPosition, surveyActions, uiActions]
  );

  // 드롭 핸들러 (팔레트에서 드래그)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // 마지막 질문 노드 찾기
      const questionNodes = nodes.filter((n) => n.type === 'question');

      let position: XYPosition;

      if (questionNodes.length === 0) {
        // 첫 번째 질문 노드: start 노드 기준으로 배치
        const startNode = nodes.find((n) => n.id === 'start');
        position = {
          x: (startNode?.position.x || 0) + 400,
          y: startNode?.position.y || 200,
        };
      } else {
        // 마지막 질문 노드에서 400px 오른쪽에 자동 배치
        const lastNode = questionNodes.reduce((max, node) =>
          node.position.x > max.position.x ? node : max
        );
        position = {
          x: lastNode.position.x + 400,
          y: lastNode.position.y, // 같은 높이 유지
        };
      }

      surveyActions.addQuestionNode(type as any, position);
      surveyActions.setDirty(true);
    },
    [nodes, surveyActions, historyActions, edges]
  );


  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete 키로 노드 삭제
      if (event.key === 'Delete' && selectedNodeId) {
        // 시작/종료 노드는 삭제 불가
        if (selectedNodeId === 'start' || selectedNodeId === 'end') {
          uiActions.showToast('시작/종료 노드는 삭제할 수 없습니다.', 'warning');
          return;
        }
        surveyActions.deleteNode(selectedNodeId);
      }

      // Ctrl+Z: Undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        const previousState = historyActions.undo();
        if (previousState) {
          surveyActions.setNodes(previousState.nodes);
          surveyActions.setEdges(previousState.edges);
          uiActions.showToast('실행 취소됨', 'info');
        }
      }

      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if (
        (event.ctrlKey && event.shiftKey && event.key === 'z') ||
        (event.ctrlKey && event.key === 'y')
      ) {
        event.preventDefault();
        const nextState = historyActions.redo();
        if (nextState) {
          surveyActions.setNodes(nextState.nodes);
          surveyActions.setEdges(nextState.edges);
          uiActions.showToast('다시 실행됨', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, edges, surveyActions, historyActions, uiActions]);

  return (
    <div
      ref={reactFlowWrapper}
      className={cn(
        'flex-1 h-full w-full',
        isDarkMode ? 'dark' : ''
      )}
      data-testid="canvas-area"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(connection) => connection.source !== 'end'}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onMove={onMove}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={['Delete', 'Backspace']}
        minZoom={0.1}
        maxZoom={4}
        zoomOnScroll={true}
        panOnScroll={false}
        panOnDrag={false} // 마우스 왼쪽 드래그로 이동(Pan) 비활성화
        selectionOnDrag={true} // 드래그 선택 활성화
        selectionMode={SelectionMode.Partial}
        panActivationKeyCode="Space" // 스페이스바를 누를 때만 이동 가능
        multiSelectionKeyCode="Control" // 컨트롤 키를 누르고 선택 가능
        selectionKeyCode="Shift" // 시프트 키를 누르고 드래그 선택 가능
        snapToGrid
        snapGrid={[100, 100]}
        className={cn(
          'bg-gray-50 dark:bg-gray-950',
          'transition-colors duration-200'
        )}
        proOptions={{ hideAttribution: true }}
      >
        {/* 100px 그리드 배경 (연한 대시 라인) */}
        <Background
          variant={BackgroundVariant.Lines}
          gap={100}
          size={0.5}
          color={isDarkMode ? '#374151' : '#d1d5db'}
          style={{
            opacity: 0.35,
            strokeDasharray: '5 5'
          }}
        />
        {/* 교차점 도트 (현재 유지) */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={50}
          size={0.8}
          color={isDarkMode ? '#4b5563' : '#9ca3af'}
          style={{ opacity: 0.3 }}
        />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-lg"
        />
        {/* Draggable MiniMap with dock functionality */}
        <DraggableMiniMap />

        {/* 커스텀 컨트롤 패널 */}
        <Panel position="top-right" className="!m-4">
          <CanvasControls />
        </Panel>
      </ReactFlow>

      {/* 컨텍스트 메뉴 */}
      {contextMenu.isOpen && (
        <ContextMenu
          position={contextMenu.position}
          nodeId={contextMenu.nodeId}
          onClose={() => uiActions.closeContextMenu()}
        />
      )}
    </div>
  );
}
