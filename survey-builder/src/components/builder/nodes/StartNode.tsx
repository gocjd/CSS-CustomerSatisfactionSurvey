'use client';

// components/builder/nodes/StartNode.tsx - 시작 노드 컴포넌트

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { StartNode as StartNodeType } from '@/types';
import { Play } from 'lucide-react';

function StartNodeComponent({ data, selected }: NodeProps<StartNodeType>) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'w-24 h-24 rounded-full',
        'bg-gradient-to-br from-emerald-400 to-emerald-600',
        'shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50',
        'border-4 border-white dark:border-gray-800',
        'transition-all duration-200',
        selected && 'ring-4 ring-emerald-200 dark:ring-emerald-800 scale-105'
      )}
      data-testid="node-start"
    >
      <div className="flex flex-col items-center gap-1">
        <Play className="w-8 h-8 text-white fill-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          {data.label}
        </span>
      </div>

      {/* Output Port (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-default"
        className={cn(
          '!w-5 !h-5 !bg-white !border-4 !border-emerald-500 !rounded-full',
          '!-right-2.5',
          'transition-transform hover:!scale-125'
        )}
        data-handleid="output-default"
      />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);
StartNode.displayName = 'StartNode';
