'use client';

// components/builder/property/tabs/BranchingTab.tsx - 분기 로직 탭

import { useSurveyStore, useSurveyActions } from '@/stores';
import type { Question, QuestionNode } from '@/types';
import { ArrowRight, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BranchingTabProps {
  question: Question;
  nodeId: string;
}

export function BranchingTab({ question, nodeId }: BranchingTabProps) {
  const nodes = useSurveyStore((state) => state.nodes);
  const edges = useSurveyStore((state) => state.edges);
  const surveyActions = useSurveyActions();

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
  const hasBranching = question.questionType === 'multiple_choice' && question.options;
  const isSinglePath = typeof question.nextQuestion === 'string';
  const isMultiBranch = typeof question.nextQuestion === 'object' && question.nextQuestion !== null;

  // 단일 분기로 변환
  const convertToSinglePath = () => {
    // 모든 옵션 연결 삭제
    const edgesToDelete = outgoingEdges.filter(e =>
      e.sourceHandle && e.sourceHandle.startsWith('output-')
    );
    edgesToDelete.forEach(e => surveyActions.deleteEdge(e.id));

    // nextQuestion을 null로 설정 (사용자가 수동으로 연결하도록)
    surveyActions.updateQuestionNode(nodeId, { nextQuestion: null });
  };

  // 멀티 분기로 변환
  const convertToMultiBranch = () => {
    // 기존 default 연결 삭제
    const defaultEdge = outgoingEdges.find(e => e.sourceHandle === 'output-default');
    if (defaultEdge) {
      surveyActions.deleteEdge(defaultEdge.id);
    }

    // nextQuestion을 빈 객체로 설정 (사용자가 수동으로 연결하도록)
    surveyActions.updateQuestionNode(nodeId, { nextQuestion: {} });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          분기 로직
        </h3>
      </div>

      {!hasBranching ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            객관식 질문에서만 분기 로직을 설정할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          {/* 분기 유형 선택 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              분기 유형
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={convertToSinglePath}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-left',
                  isSinglePath || (!isSinglePath && !isMultiBranch)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">단일 분기</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  모든 옵션이 같은 질문으로 이동
                </div>
              </button>

              <button
                onClick={convertToMultiBranch}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-left',
                  isMultiBranch
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">멀티 분기</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  옵션별로 다른 질문으로 이동
                </div>
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {isSinglePath || (!isSinglePath && !isMultiBranch)
                ? '단일 분기: 캔버스에서 기본 포트를 다른 질문에 연결하세요.'
                : '멀티 분기: 캔버스에서 각 옵션의 포트를 다른 질문에 연결하세요.'}
            </p>
          </div>

          {/* 현재 연결 상태 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              현재 연결 상태
            </h4>

            {outgoingEdges.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                연결된 질문이 없습니다.
              </p>
            ) : isMultiBranch ? (
              <div className="space-y-2">
                {question.options?.map((option) => {
                  const edge = outgoingEdges.find(
                    (e) =>
                      e.sourceHandle === `output-${option.value}` ||
                      (e.data?.condition === option.value)
                  );
                  const targetInfo = edge ? getTargetNodeInfo(edge.target) : null;

                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center justify-between p-3',
                        'bg-white dark:bg-gray-800 rounded-lg',
                        'border',
                        targetInfo
                          ? 'border-green-200 dark:border-green-800'
                          : 'border-gray-200 dark:border-gray-700'
                      )}
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        "{option.label}" 선택 시
                      </span>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        {targetInfo ? (
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {targetInfo.id === 'end' ? '종료' : `${targetInfo.id}`}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            미연결
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    기본 경로 (모든 옵션)
                  </span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getTargetNodeInfo(
                        outgoingEdges.find((e) => e.sourceHandle === 'output-default')?.target || ''
                      )?.title || '미연결'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
