'use client';

import React from 'react';
import { MiniMapNodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';

export const MiniMapNode = ({
    id,
    x: rawX,
    y: rawY,
    width: rawWidth,
    height: rawHeight,
    selected,
    type,
    data,
}: any) => {
    const isDarkMode = useUIStore((state) => state.isDarkMode);

    // NaN 보호 로직
    const x = isNaN(rawX) ? 0 : rawX;
    const y = isNaN(rawY) ? 0 : rawY;
    const width = isNaN(rawWidth) ? 0 : rawWidth;
    const height = isNaN(rawHeight) ? 0 : rawHeight;

    // 시작 노드 테마 (에메랄드/녹색)
    if (type === 'start') {
        return (
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#10b981" // emerald-500
                rx={width / 2} // 완전한 원형
                stroke={selected ? '#fff' : 'none'}
                strokeWidth={selected ? 4 : 0}
            />
        );
    }

    // 종료 노드 테마 (로즈/빨간색)
    if (type === 'end') {
        return (
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#f43f5e" // rose-500
                rx={width / 2} // 완전한 원형
                stroke={selected ? '#fff' : 'none'}
                strokeWidth={selected ? 4 : 0}
            />
        );
    }

    // 질문 노드 테마 (정사각형/텍스트 포함)
    if (type === 'question') {
        const question = (data as any)?.question;
        const questionId = question?.questionId || id;
        const title = question?.title || '질문';

        // 텍스트 크기 조정
        const idFontSize = Math.min(width, height) * 0.25;
        const titleFontSize = Math.min(width, height) * 0.15;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={selected ? '#4f46e5' : '#3b82f6'}
                    stroke={selected ? '#ffffff' : 'none'}
                    strokeWidth={selected ? 4 : 0}
                    rx={8}
                />

                {/* 단순화된 색상 블록 */}
                <rect
                    x={x + 4}
                    y={y + 4}
                    width={width - 8}
                    height={height - 8}
                    fill={selected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}
                    rx={4}
                />
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={idFontSize * 1.5}
                    fontWeight="bold"
                    fill={selected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'}
                >
                    {questionId}
                </text>

                {/* 선택 시 외곽선 강조 (Optional) */}
                {selected && (
                    <rect
                        x={x - 2}
                        y={y - 2}
                        width={width + 4}
                        height={height + 4}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        rx={10}
                    />
                )}
            </g>
        );
    }

    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="#e2e8f0"
            rx={4}
        />
    );
};
