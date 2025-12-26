import { useCallback } from 'react';
import { useSurveyStore, useSurveyActions } from '@/stores';
import type { Question, QuestionNode, QuestionOption } from '@/types';
import { ArrowRight, GitBranch, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { SortableOptionItem } from './SortableOptionItem';

interface BranchingTabProps {
  question: Question;
  nodeId: string;
}

export function BranchingTab({ question, nodeId }: BranchingTabProps) {
  const nodes = useSurveyStore((state) => state.nodes);
  const edges = useSurveyStore((state) => state.edges);
  const surveyActions = useSurveyActions();
  const options = question.options || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  // 현재 노드에서 나가는 연결 찾기
  const outgoingEdges = edges.filter((e) => e.source === nodeId);

  // 연결된 대상 노드 정보 가져오기
  const getTargetNodeInfo = (targetId: string) => {
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!targetNode) return null;

    if (targetNode.type === 'question') {
      const q = (targetNode as QuestionNode).data.question;
      return { id: q.questionId, title: q.title };
    }
    if (targetNode.type === 'end') {
      return { id: 'end', title: '설문 종료' };
    }
    return null;
  };

  // 분기 유형 판단
  const hasBranching = question.questionType === 'multiple_choice';
  const isSinglePath = typeof question.nextQuestion === 'string';
  const isMultiBranch = typeof question.nextQuestion === 'object' && question.nextQuestion !== null;

  // 단일 분기로 변환
  const convertToSinglePath = () => {
    const edgesToDelete = outgoingEdges.filter(e =>
      e.sourceHandle && e.sourceHandle.startsWith('output-')
    );
    edgesToDelete.forEach(e => surveyActions.deleteEdge(e.id));
    surveyActions.updateQuestionNode(nodeId, { nextQuestion: null });
  };

  // 멀티 분기로 변환
  const convertToMultiBranch = () => {
    const defaultEdge = outgoingEdges.find(e => e.sourceHandle === 'output-default');
    if (defaultEdge) {
      surveyActions.deleteEdge(defaultEdge.id);
    }
    surveyActions.updateQuestionNode(nodeId, { nextQuestion: {} });
  };

  return (
    <div className="space-y-6">
      {/* 1. 분기 유형 선택 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            분기 유형
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={convertToSinglePath}
            className={cn(
              'p-2.5 rounded-lg border transition-all text-left relative',
              isSinglePath || (!isSinglePath && !isMultiBranch)
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <div className="font-semibold text-xs text-gray-900 dark:text-gray-100">단일 경로</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
              모든 답변이 공통 질문으로 이동
            </div>
            {(isSinglePath || (!isSinglePath && !isMultiBranch)) && (
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={convertToMultiBranch}
            disabled={!hasBranching}
            className={cn(
              'p-2.5 rounded-lg border transition-all text-left relative',
              !hasBranching && 'opacity-50 cursor-not-allowed',
              isMultiBranch
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <div className="font-semibold text-xs text-gray-900 dark:text-gray-100">조건별 분기</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
              답변에 따라 다른 질문으로 이동
            </div>
            {isMultiBranch && (
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* 2. 옵션 및 연결 관리 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isMultiBranch ? '옵션별 분기 설정' : '선택 옵션 관리'}
            </h3>
            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
              {options.length}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="h-7 px-2 text-[11px] border-dashed hover:border-indigo-500 hover:text-indigo-600"
          >
            <Plus className="w-3 h-3 mr-1" />
            옵션 추가
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3">
            <SortableContext
              items={options.map((o) => o.value)}
              strategy={verticalListSortingStrategy}
            >
              {options.map((option, index) => {
                // 멀티 분기일 때 연결 상태 찾기
                const edge = isMultiBranch
                  ? outgoingEdges.find(e => e.sourceHandle === `output-${option.value}` || e.data?.condition === option.value)
                  : null;
                const targetInfo = edge ? getTargetNodeInfo(edge.target) : null;

                return (
                  <div key={option.value} className="space-y-1.5">
                    <SortableOptionItem
                      id={option.value}
                      option={option}
                      index={index}
                      onUpdate={handleUpdateOption}
                      onRemove={handleRemoveOption}
                      isRemovable={options.length > 1}
                    />
                    {isMultiBranch && (
                      <div className="flex items-center gap-2 px-3 py-1.5 ml-8 bg-white dark:bg-gray-900/50 rounded-md border border-gray-100 dark:border-gray-800/50 text-[11px]">
                        <span className="text-gray-400 font-medium whitespace-nowrap">연결 대상:</span>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                        {targetInfo ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate">
                            {targetInfo.id === 'end' ? '설문 종료' : `[${targetInfo.id}] ${targetInfo.title}`}
                          </span>
                        ) : (
                          <span className="text-amber-500 italic font-medium animate-pulse">캔버스에서 연결이 필요합니다.</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </div>
        </DndContext>

        {/* 단일 분기일 때의 공통 경로 표시 */}
        {!isMultiBranch && outgoingEdges.length > 0 && (
          <div className="mt-4 p-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-900/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">공통 다음 질문</span>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3 text-indigo-400" />
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {getTargetNodeInfo(
                    outgoingEdges.find((e) => e.sourceHandle === 'output-default' || !e.sourceHandle)?.target || ''
                  )?.title || '미연결 (캔버스에서 연결)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
