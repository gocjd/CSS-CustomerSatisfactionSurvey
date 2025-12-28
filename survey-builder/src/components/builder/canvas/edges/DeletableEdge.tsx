'use client';

import React, { useState } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type EdgeProps,
} from '@xyflow/react';
import { Trash2, Plus } from 'lucide-react';
import { useSurveyActions } from '@/stores';
import { useUIActions } from '@/stores';
import { cn } from '@/lib/utils';
import { QuestionTypeMenu } from './QuestionTypeMenu';

export function DeletableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    source,
    target,
    data,
}: EdgeProps) {
    const surveyActions = useSurveyActions();
    const uiActions = useUIActions();
    const [showMenu, setShowMenu] = useState(false);

    // Apply offset if available (for multiple edges to same target)
    const offset = (data as any)?.offset || 0;
    const adjustedTargetX = targetX + offset;
    const adjustedSourceX = sourceX;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX: adjustedSourceX,
        sourceY,
        sourcePosition,
        targetX: adjustedTargetX,
        targetY,
        targetPosition,
        borderRadius: 60, // 곡선 곡률 조정: 노드 간 간격(200) 증가에 맞춤
    });

    const onEdgeClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        // Store deletion will trigger React Flow sync
        surveyActions.deleteEdge(id);
        surveyActions.setDirty(true);
    };

    const onAddQuestion = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        setShowMenu(true);
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan flex items-center gap-1"
                >
                    <button
                        title="연결선 사이에 질문 추가"
                        className={cn(
                            "w-6 h-6 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-colors",
                            "dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-blue-900/30"
                        )}
                        onClick={onAddQuestion}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        title="연결 삭제"
                        className={cn(
                            "w-6 h-6 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors",
                            "dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-red-900/30"
                        )}
                        onClick={onEdgeClick}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 질문 타입 선택 메뉴 */}
                    {showMenu && (
                        <QuestionTypeMenu
                            edgeId={id}
                            sourceNodeId={source!}
                            targetNodeId={target!}
                            onClose={() => setShowMenu(false)}
                        />
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
