'use client';

// components/builder/nodes/EndNode.tsx - 종료 노드 컴포넌트

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { EndNode as EndNodeType } from '@/types';
import { Flag } from 'lucide-react';

function EndNodeComponent({ data, selected }: NodeProps<EndNodeType>) {
  const { hasError, errorMessages } = data;

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'w-24 h-24 rounded-full',
        'bg-gradient-to-br from-rose-400 to-rose-600',
        'shadow-lg shadow-rose-200 dark:shadow-rose-900/50',
        'border-4 border-white dark:border-gray-800',
        selected && 'ring-4 ring-rose-200 dark:ring-rose-800 scale-105',
        hasError && 'ring-4 ring-red-500 ring-offset-2 animate-pulse'
      )}
      data-testid="node-end"
    >
      {/* Input Port (Left) - 더 큰 크기로 연결하기 쉽게 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectableStart={false} // 종료 노드에서 드래그 시작 불가
        className={cn(
          '!w-6 !h-6 !bg-white !border-4 !border-rose-500 !rounded-full',
          '!-left-3 !top-1/2 !-translate-y-1/2',
          'transition-transform hover:!scale-125'
        )}
        data-handleid="input"
      />

      <div className="flex flex-col items-center gap-1">
        <Flag className="w-8 h-8 text-white fill-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          {data.label}
        </span>
      </div>

      {/* Error Tooltip */}
      {hasError && errorMessages && errorMessages.length > 0 && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
          {errorMessages[0]}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45" />
        </div>
      )}
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);
EndNode.displayName = 'EndNode';
