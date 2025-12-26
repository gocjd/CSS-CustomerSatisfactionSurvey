'use client';

// components/builder/nodes/EndNode.tsx - 종료 노드 컴포넌트

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { EndNode as EndNodeType } from '@/types';
import { Flag } from 'lucide-react';

function EndNodeComponent({ data, selected }: NodeProps<EndNodeType>) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'w-24 h-24 rounded-full',
        'bg-gradient-to-br from-rose-400 to-rose-600',
        'shadow-lg shadow-rose-200 dark:shadow-rose-900/50',
        'border-4 border-white dark:border-gray-800',
        'transition-all duration-200',
        selected && 'ring-4 ring-rose-200 dark:ring-rose-800 scale-105'
      )}
      data-testid="node-end"
    >
      {/* Input Port (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className={cn(
          '!w-5 !h-5 !bg-white !border-4 !border-rose-500 !rounded-full',
          '!-left-2.5',
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
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);
EndNode.displayName = 'EndNode';
