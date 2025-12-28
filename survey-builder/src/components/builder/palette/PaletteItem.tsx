'use client';

// components/builder/palette/PaletteItem.tsx - 팔레트 아이템

import { memo } from 'react';
import { ImageIcon, ListChecks, MessageSquare, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useUIActions } from '@/stores';
import type { QuestionType } from '@/types';

interface PaletteItemProps {
  type: QuestionType;
  label: string;
  description: string;
  icon: 'list' | 'text' | 'mic' | 'image';
  compact?: boolean;
}

const iconMap = {
  list: ListChecks,
  text: MessageSquare,
  mic: Mic,
  image: ImageIcon,
};

const colorMap: Record<QuestionType, { bg: string; text: string; border: string }> = {
  multiple_choice: {
    bg: 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  text_opinion: {
    bg: 'bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  voice_opinion: {
    bg: 'bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  image_item: {
    bg: 'bg-orange-50 dark:bg-orange-950 hover:bg-orange-100 dark:hover:bg-orange-900',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
};

function PaletteItemComponent({
  type,
  label,
  description,
  icon,
  compact = false,
}: PaletteItemProps) {
  const uiActions = useUIActions();
  const selectedQuestionType = useUIStore((state) => state.selectedQuestionType);
  const isSelected = selectedQuestionType === type;

  const handleClick = () => {
    uiActions.setSelectedQuestionType(isSelected ? null : type);
  };
  const Icon = iconMap[icon];
  const colors = colorMap[type];

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
    uiActions.setDragging(true, type);
  };

  const handleDragEnd = () => {
    uiActions.setDragging(false);
  };

  if (compact) {
    return (
      <div
        draggable
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          'w-10 h-10 flex items-center justify-center',
          'rounded-xl border-2 cursor-pointer',
          colors.bg,
          isSelected ? 'border-indigo-600 ring-2 ring-indigo-300' : colors.border,
          'transition-all duration-200',
          'hover:scale-110 hover:shadow-md'
        )}
        title={`${label} - ${description}`}
        data-testid={`palette-${type}`}
      >
        <Icon className={cn('w-5 h-5', colors.text)} />
      </div>
    );
  }

  return (
    <div
      draggable
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'flex items-center gap-3 p-3',
        'rounded-xl border-2 cursor-pointer',
        colors.bg,
        isSelected ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-600' : colors.border,
        'transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        'group'
      )}
      data-testid={`palette-${type}`}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10',
          'rounded-lg bg-white dark:bg-gray-800',
          'shadow-sm',
          'transition-transform duration-200',
          'group-hover:scale-110'
        )}
      >
        <Icon className={cn('w-5 h-5', colors.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
          {description}
        </p>
      </div>
    </div>
  );
}

export const PaletteItem = memo(PaletteItemComponent);
PaletteItem.displayName = 'PaletteItem';
