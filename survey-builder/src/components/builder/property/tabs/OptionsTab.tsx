'use client';

// components/builder/property/tabs/OptionsTab.tsx - 옵션 탭 (객관식)

import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { useSurveyActions } from '@/stores';
import type { Question, QuestionOption } from '@/types';
import { SortableOptionItem } from './SortableOptionItem';

interface OptionsTabProps {
  question: Question;
  nodeId: string;
}

export function OptionsTab({ question, nodeId }: OptionsTabProps) {
  const surveyActions = useSurveyActions();
  const options = question.options || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 드래그 시작 전 최소 이동 거리
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateOptions = useCallback(
    (newOptions: QuestionOption[]) => {
      surveyActions.updateQuestionNode(nodeId, { options: newOptions });
    },
    [nodeId, surveyActions]
  );

  const handleAddOption = useCallback(() => {
    const nextVal = options.length > 0
      ? (Math.max(...options.map(o => parseInt(o.value) || 0)) + 1).toString()
      : "1";

    const newOption: QuestionOption = {
      value: nextVal,
      label: `옵션 ${options.length + 1}`,
      score: options.length + 1,
    };
    updateOptions([...options, newOption]);
  }, [options, updateOptions]);

  const handleRemoveOption = useCallback(
    (index: number) => {
      if (options.length <= 1) return;
      const newOptions = options.filter((_, i) => i !== index);
      updateOptions(newOptions);
    },
    [options, updateOptions]
  );

  const handleUpdateOption = useCallback(
    (index: number, field: keyof QuestionOption, value: string | number) => {
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      updateOptions(newOptions);
    },
    [options, updateOptions]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((opt) => opt.value === active.id);
      const newIndex = options.findIndex((opt) => opt.value === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        updateOptions(arrayMove(options, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          선택 옵션 ({options.length}개)
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          className="h-8 text-xs border-dashed"
          data-testid="add-option"
        >
          <Plus className="w-3 h-3 mr-1" />
          추가
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2">
          <SortableContext
            items={options.map((o) => o.value)}
            strategy={verticalListSortingStrategy}
          >
            {options.map((option, index) => (
              <SortableOptionItem
                key={option.value}
                id={option.value}
                option={option}
                index={index}
                onUpdate={handleUpdateOption}
                onRemove={handleRemoveOption}
                isRemovable={options.length > 1}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {options.length < 2 && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-100 dark:border-amber-900/30">
          (!) 원활한 분석을 위해 최소 2개의 옵션 구성을 권장합니다.
        </p>
      )}

      <div className="pt-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-900/20 text-sm text-gray-600 dark:text-gray-300">
        <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">사용 팁</p>
        <p>• 왼쪽 핸들을 드래그하여 순서를 변경하세요.</p>
        <p className="mt-1">• 변경된 순서는 캔버스 노드의 포트 순서에도 즉시 반영됩니다.</p>
      </div>
    </div>
  );
}
