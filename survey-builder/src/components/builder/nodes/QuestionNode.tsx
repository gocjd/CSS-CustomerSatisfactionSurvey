'use client';

// components/builder/nodes/QuestionNode.tsx - 질문 노드 컴포넌트

import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { QuestionNode as QuestionNodeType } from '@/types';
import {
  ListChecks,
  MessageSquare,
  Mic,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

const questionTypeIcons = {
  multiple_choice: ListChecks,
  text_opinion: MessageSquare,
  voice_opinion: Mic,
} as const;

const questionTypeColors = {
  multiple_choice: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  text_opinion: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    accent: 'text-green-600 dark:text-green-400',
  },
  voice_opinion: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
    accent: 'text-purple-600 dark:text-purple-400',
  },
} as const;

function QuestionNodeComponent({ data, selected }: NodeProps<QuestionNodeType>) {
  const { question, hasError, errorMessages } = data;
  const Icon = questionTypeIcons[question.questionType];
  const colors = questionTypeColors[question.questionType];

  // 조건부 분기인 경우 Output 포트 계산
  const outputPorts = useMemo(() => {
    // 조건부 분기인 경우 Output 포트 계산
    if (
      typeof question.nextQuestion === 'object' &&
      question.nextQuestion !== null
    ) {
      return Object.entries(question.nextQuestion).map(([value, targetId]) => ({
        id: `output-${value}`,
        label: question.options?.find((o) => o.value === value)?.label || value,
        value,
      }));
    }

    // 기본: 단일 출력 포트
    return [{ id: 'output-default', label: '다음', value: 'default' }];
  }, [question.nextQuestion, JSON.stringify(question.options)]);

  const isBranching = outputPorts.length > 1;

  return (
    <div
      className={cn(
        'min-w-[280px] max-w-[320px] rounded-xl border-2 bg-white shadow-lg transition-all duration-200',
        'dark:bg-gray-900',
        selected && 'border-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900',
        hasError && 'border-red-500 ring-4 ring-red-100 dark:ring-red-900',
        !selected && !hasError && 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl'
      )}
      data-testid={`node-${question.questionId}`}
      data-selected={selected}
      data-has-error={hasError}
      data-question-type={question.questionType}
    >
      {/* Input Port (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className={cn(
          '!w-4 !h-4 !bg-indigo-500 !border-2 !border-white !rounded-full',
          '!-left-2 !top-1/2 !-translate-y-1/2',
          'transition-transform hover:!scale-125'
        )}
        data-handleid="input"
      />

      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b rounded-t-xl',
          colors.bg,
          colors.border
        )}
      >
        <div className="flex items-center gap-3">
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg',
              colors.bg,
              colors.accent
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {question.questionId}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[160px]">
              {question.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {question.required && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
              필수
            </span>
          )}
          {hasError && (
            <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
          )}
        </div>
      </div>

      {/* Body - Prompt Preview */}
      <div className="px-4 py-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {question.promptType === 'voice_prompt'
            ? question.audio?.transcript || '음성 프롬프트'
            : question.prompt}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full',
              colors.bg,
              colors.accent
            )}
          >
            <Icon className="w-3 h-3" />
            {question.questionType === 'multiple_choice'
              ? '객관식'
              : question.questionType === 'text_opinion'
                ? '텍스트'
                : '음성'}
          </span>
          {question.displayType === 'likert_scale' && (
            <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-full">
              Likert Scale
            </span>
          )}
          {isBranching && (
            <span className="px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full">
              분기
            </span>
          )}
        </div>
      </div>

      {/* Output Ports (Right) */}
      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        {outputPorts.map((port, index) => (
          <div
            key={port.id}
            className={cn(
              'relative flex items-center justify-end px-4 py-2',
              index !== outputPorts.length - 1 &&
              'border-b border-gray-100 dark:border-gray-700'
            )}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-3 truncate max-w-[200px]">
              {port.label}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              className={cn(
                '!w-4 !h-4 !border-2 !border-white !rounded-full',
                '!-right-2',
                'transition-transform hover:!scale-125',
                port.value === 'default'
                  ? '!bg-emerald-500'
                  : '!bg-orange-500'
              )}
              style={{ top: '50%', transform: 'translateY(-50%)' }}
              data-handleid={port.id}
            />
          </div>
        ))}
      </div>

      {/* Error Messages Tooltip */}
      {hasError && errorMessages.length > 0 && (
        <div
          className={cn(
            'absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full',
            'bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-10',
            'animate-in fade-in slide-in-from-top-1 duration-200'
          )}
          data-testid="error-tooltip"
        >
          {errorMessages[0]}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45" />
        </div>
      )}
    </div>
  );
}

export const QuestionNode = memo(QuestionNodeComponent);
QuestionNode.displayName = 'QuestionNode';
