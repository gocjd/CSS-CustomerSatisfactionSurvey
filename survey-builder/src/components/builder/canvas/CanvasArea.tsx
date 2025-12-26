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
  applyNodeChanges,
  applyEdgeChanges,
  type NodeMouseHandler,
  BackgroundVariant,
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
  const { fitView, screenToFlowPosition } = useReactFlow();

  // Store
  const nodes = useSurveyStore((state) => state.nodes);
  const edges = useSurveyStore((state) => state.edges);
  const selectedNodeId = useSurveyStore((state) => state.selectedNodeId);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const contextMenu = useUIStore((state) => state.contextMenu);

  // Actions
  const surveyActions = useSurveyActions();
  const uiActions = useUIActions();
  const historyActions = useHistoryActions();

  // 초기 뷰 맞춤
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, []);

  // 노드 변경 핸들러
  const onNodesChange: OnNodesChange<SurveyNode> = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes) as SurveyNode[];
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
        surveyActions.clearErrors(); // 새로운 연결 시 에러 초기화
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

  // 빈 공간 클릭 핸들러
  const onPaneClick = useCallback(() => {
    surveyActions.selectNode(null);
    uiActions.closeContextMenu();
  }, [surveyActions, uiActions]);

  // 드롭 핸들러 (팔레트에서 드래그)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      surveyActions.addQuestionNode(type as any, position);
      surveyActions.setDirty(true);
    },
    [screenToFlowPosition, surveyActions, historyActions, nodes, edges]
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
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={['Delete', 'Backspace']}
        minZoom={0.1}
        maxZoom={2}
        className={cn(
          'bg-gray-50 dark:bg-gray-950',
          'transition-colors duration-200'
        )}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={isDarkMode ? '#374151' : '#e5e7eb'}
        />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-lg"
        />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          position="bottom-left"
          style={{ width: 320, height: 200 }}
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-lg"
          maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
        />

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
