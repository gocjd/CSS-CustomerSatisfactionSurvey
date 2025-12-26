'use client';

// components/builder/canvas/CanvasControls.tsx - 캔버스 컨트롤 패널

import { useReactFlow } from '@xyflow/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Layout,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore, useUIActions } from '@/stores';
import { useHistoryStore, useHistoryActions } from '@/stores';
import { useSurveyStore, useSurveyActions } from '@/stores';
import { cn } from '@/lib/utils';

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const uiActions = useUIActions();

  const nodes = useSurveyStore((state) => state.nodes);
  const edges = useSurveyStore((state) => state.edges);
  const surveyActions = useSurveyActions();

  const pastCount = useHistoryStore((state) => state.past.length);
  const futureCount = useHistoryStore((state) => state.future.length);
  const canUndo = pastCount > 0;
  const canRedo = futureCount > 0;
  const historyActions = useHistoryActions();

  const handleUndo = () => {
    const previousState = historyActions.undo();
    if (previousState) {
      surveyActions.setNodes(previousState.nodes);
      surveyActions.setEdges(previousState.edges);
      uiActions.showToast('실행 취소됨', 'info');
    }
  };

  const handleRedo = () => {
    const nextState = historyActions.redo();
    if (nextState) {
      surveyActions.setNodes(nextState.nodes);
      surveyActions.setEdges(nextState.edges);
      uiActions.showToast('다시 실행됨', 'info');
    }
  };

  const handleAutoLayout = () => {
    // TODO: Dagre 자동 레이아웃 구현
    fitView({ padding: 0.2, duration: 500 });
    uiActions.showToast('자동 정렬됨', 'success');
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1.5',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-xl shadow-lg'
      )}
    >
      {/* 줌 컨트롤 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => zoomIn()}
        title="확대 (Ctrl++)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => zoomOut()}
        title="축소 (Ctrl+-)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        title="전체 보기"
        data-testid="zoom-reset"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* 히스토리 컨트롤 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleUndo}
        disabled={!canUndo}
        title="실행 취소 (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleRedo}
        disabled={!canRedo}
        title="다시 실행 (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* 레이아웃 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleAutoLayout}
        title="자동 정렬"
      >
        <Layout className="h-4 w-4" />
      </Button>

      {/* 다크모드 토글 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => uiActions.toggleDarkMode()}
        title={isDarkMode ? '라이트 모드' : '다크 모드'}
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
