'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ListChecks, MessageSquare, Mic, ImageIcon } from 'lucide-react';
import { useSurveyActions } from '@/stores';
import { QUESTION_TYPE_LABELS } from '@/types';
import type { QuestionType } from '@/types';
import { cn } from '@/lib/utils';

interface QuestionTypeMenuProps {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  onClose: () => void;
}

const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
  multiple_choice: <ListChecks className="w-4 h-4" />,
  text_opinion: <MessageSquare className="w-4 h-4" />,
  voice_opinion: <Mic className="w-4 h-4" />,
  image_item: <ImageIcon className="w-4 h-4" />,
};

const questionTypeColors: Record<QuestionType, { bg: string; text: string; hover: string }> = {
  multiple_choice: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
  },
  text_opinion: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    hover: 'hover:bg-green-100 dark:hover:bg-green-900',
  },
  voice_opinion: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
    hover: 'hover:bg-purple-100 dark:hover:bg-purple-900',
  },
  image_item: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-900',
  },
};

export function QuestionTypeMenu({
  edgeId,
  sourceNodeId,
  targetNodeId,
  onClose,
}: QuestionTypeMenuProps) {
  const surveyActions = useSurveyActions();
  const questionTypes: QuestionType[] = ['multiple_choice', 'text_opinion', 'voice_opinion', 'image_item'];
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSelectType = (questionType: QuestionType) => {
    surveyActions.insertQuestionBetweenEdge(edgeId, sourceNodeId, targetNodeId, questionType);
    onClose();
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 외부 클릭으로 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuContent = (
    <div
      ref={menuRef}
      className={cn(
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]',
        'bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700',
        'p-2 min-w-max',
        'pointer-events-auto',
        'animate-in fade-in zoom-in-95 duration-150'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2 py-1.5 mb-1">
        질문 타입 선택
      </div>

      {questionTypes.map((type) => {
        const colors = questionTypeColors[type];
        return (
          <button
            key={type}
            onClick={() => handleSelectType(type)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
              'text-left',
              colors.bg,
              colors.text,
              colors.hover,
              'dark:text-gray-300'
            )}
            title={`${QUESTION_TYPE_LABELS[type]} 추가`}
          >
            <span className="flex-shrink-0">{questionTypeIcons[type]}</span>
            <span>{QUESTION_TYPE_LABELS[type]}</span>
          </button>
        );
      })}
    </div>
  );

  // Portal을 사용하여 document.body에 렌더링
  return createPortal(menuContent, document.body);
}
