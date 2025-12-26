'use client';

import React from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type EdgeProps,
} from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useSurveyActions } from '@/stores';
import { cn } from '@/lib/utils';

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
}: EdgeProps) {
    const surveyActions = useSurveyActions();

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const onEdgeClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        // Store deletion will trigger React Flow sync
        surveyActions.deleteEdge(id);
        surveyActions.setDirty(true);
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
                    className="nodrag nopan"
                >
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
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
