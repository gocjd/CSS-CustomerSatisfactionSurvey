'use client';

// components/builder/BuilderLayout.tsx - 빌더 레이아웃

import { ReactFlowProvider } from '@xyflow/react';
import { BuilderHeader } from './BuilderHeader';
import { QuestionPalette } from './palette/QuestionPalette';
import { CanvasArea } from './canvas/CanvasArea';
import { PropertyPanel } from './property/PropertyPanel';
import { Toast } from '@/components/shared/Toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

export function BuilderLayout() {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  return (
    <div
      className={cn(
        'flex flex-col h-screen w-screen overflow-hidden',
        'bg-gray-100 dark:bg-gray-950',
        isDarkMode ? 'dark' : ''
      )}
    >
      {/* 헤더 */}
      <BuilderHeader />

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 질문 팔레트 */}
        <QuestionPalette />

        {/* 중앙: 캔버스 */}
        <ReactFlowProvider>
          <CanvasArea />
        </ReactFlowProvider>

        {/* 오른쪽: 속성 패널 */}
        <PropertyPanel />
      </div>

      {/* 글로벌 UI 컴포넌트 */}
      <Toast />
      <ConfirmDialog />
    </div>
  );
}
