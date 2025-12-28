'use client';

// components/builder/nodes/QuestionNode.tsx - 질문 노드 컴포넌트

import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { QuestionNode as QuestionNodeType } from '@/types';
import { useSurveyStore } from '@/stores';
import {
  ListChecks,
  MessageSquare,
  Mic,
  ImageIcon,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

const questionTypeIcons = {
  multiple_choice: ListChecks,
  text_opinion: MessageSquare,
  voice_opinion: Mic,
  image_item: ImageIcon,
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
  image_item: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
    accent: 'text-orange-600 dark:text-orange-400',
  },
} as const;

function QuestionNodeComponent({ data, selected, id }: NodeProps<QuestionNodeType>) {
  const { question, hasError, errorMessages } = data;
  const Icon = questionTypeIcons[question.questionType];
  const colors = questionTypeColors[question.questionType];

  // 노드의 현재 위치 가져오기
  const nodes = useSurveyStore((state) => state.nodes);
  const currentNode = nodes.find((n) => n.id === id);
  const xPos = currentNode?.position?.x ?? 0;
  const yPos = currentNode?.position?.y ?? 0;

  // 조건부 분기인 경우 Output 포트 계산
  const outputPorts = useMemo(() => {
    const isMultiBranch = typeof question.nextQuestion === 'object' && question.nextQuestion !== null;

    // 조건부 분기인 경우: 모든 옵션을 포트로 생성
    if (isMultiBranch && question.options && question.options.length > 0) {
      return question.options.map((option) => ({
        id: `output-${option.value}`,
        label: option.label,
        value: option.value,
      }));
    }

    // 기본: 단일 출력 포트 (단일 경로 모드이거나 옵션이 없는 경우)
    return [{ id: 'output-default', label: '다음', value: 'default' }];
  }, [question.nextQuestion, JSON.stringify(question.options)]);

  const isBranching = outputPorts.length > 1;

  return (
    <div
      className={cn(
        'min-w-[280px] max-w-[320px] rounded-xl border-2 bg-white shadow-lg',
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
      {/* Input Port (Left) - 더 큰 크기로 연결하기 쉽게 */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className={cn(
          '!w-6 !h-6 !bg-indigo-500 !border-2 !border-white !rounded-full',
          '!-left-3 !top-1/2 !-translate-y-1/2',
          'transition-transform hover:!scale-125 z-30'
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
          {/* 좌표 표시 (디버그용) */}
          <div className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
            <div className="font-mono text-gray-600 dark:text-gray-300">
              X: <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(xPos)}</span>
            </div>
            <div className="font-mono text-gray-600 dark:text-gray-300">
              Y: <span className="font-bold text-green-600 dark:text-green-400">{Math.round(yPos)}</span>
            </div>
          </div>
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
        {question.questionType === 'image_item' && question.imageUrl && (
          <div className="mt-3 relative aspect-video rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
            <img
              src={question.imageUrl}
              alt={question.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
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
          {isBranching ? (
            <span className="px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full border border-orange-200">
              조건
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full border border-blue-200">
              단일
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
              'relative flex items-center justify-end px-4 py-3 min-h-[44px] group/item',
              index !== outputPorts.length - 1 &&
              'border-b border-gray-100 dark:border-gray-700',
              'transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50'
            )}
          >

            {/* Label */}
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-5 select-none z-10 transition-colors group-hover/item:text-indigo-700">
              {port.label === '다음' ? '단일' : port.label}
            </span>

            {/* Handle - Node의 테두리에 논리적 중심을 맞춤 */}
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              className={cn(
                '!w-4 !h-full !border-0 !bg-transparent !opacity-0 !pointer-events-auto',
                '!absolute !top-0 !right-0 !translate-x-1/2 !z-30',
                'cursor-alias',
                // Click area extension to the left (covers the label)
                'after:content-[""] after:absolute after:right-0 after:top-0 after:w-[280px] after:h-full after:cursor-alias'
              )}
              data-handleid={port.id}
            />

            {/* Visual indicator (Circle) - 더 큰 크기 */}
            <div className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
              'w-5 h-5 border-2 border-white rounded-full z-20 shadow-sm transition-all duration-200 pointer-events-none',
              'group-hover/item:scale-125 group-hover/item:shadow-md',
              port.value === 'default'
                ? 'bg-emerald-500'
                : 'bg-orange-500'
            )} />
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
