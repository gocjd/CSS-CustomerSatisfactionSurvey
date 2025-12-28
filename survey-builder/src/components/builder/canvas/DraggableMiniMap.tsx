'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MiniMap } from '@xyflow/react';
import { useUIStore, useUIActions, useSurveyStore } from '@/stores';
import { GripHorizontal, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiniMapNode } from './MiniMapNode';

export function DraggableMiniMap() {
    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const isMiniMapDocked = useUIStore((state) => state.isMiniMapDocked);
    const fileName = useSurveyStore((state) => state.fileName);
    const survey = useSurveyStore((state) => state.survey);
    const surveyTitle = fileName || survey?.title || 'MiniMap';
    const uiActions = useUIActions();

    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // useEffect에서 초기화
    const [isMounted, setIsMounted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isDockZone, setIsDockZone] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // 초기 위치 설정 (클라이언트 사이드 전용)
    useEffect(() => {
        setPosition({ x: window.innerWidth - 340, y: 20 });
        setIsMounted(true);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragStart.current.x;
            const newY = e.clientY - dragStart.current.y;
            setPosition({ x: newX, y: newY });

            // 도킹 영역 감지
            const dockElement = document.getElementById('minimap-dock-destination');
            if (dockElement) {
                const rect = dockElement.getBoundingClientRect();
                const isInDockZone =
                    e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom;
                setIsDockZone(isInDockZone);
            }
        };

        const handleMouseUp = () => {
            if (isDragging && isDockZone) {
                uiActions.setMiniMapDocked(true);
            }
            setIsDragging(false);
            setIsDockZone(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isDockZone, position, uiActions]);

    // MiniMap common props
    const miniMapProps = {
        nodeComponent: MiniMapNode,
        pannable: true,
        zoomable: false, // NaN 오류 재발 방지를 위해 미니맵 내부 줌 기능 비활성화
        nodeStrokeWidth: 3,
        // 마스크 투명도를 조절하여 노드가 더 잘 보이게 함
        maskColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.4)',
        nodeColor: (n: any) => {
            if (n.type === 'start') return '#10b981';
            if (n.type === 'end') return '#f43f5e';
            if (n.selected) return '#4f46e5';
            return isDarkMode ? '#334155' : '#3b82f6';
        },
        nodeStrokeColor: (n: any) => {
            if (n.selected) return '#ffffff';
            return isDarkMode ? '#475569' : '#94a3b8';
        },
        style: { width: '100%', height: '100%' },
    };

    // 도킹 모드일 때: Portal을 사용하여 질문 팔레트로 렌더링 이동
    if (isMiniMapDocked) {
        const dockElement = typeof document !== 'undefined' ? document.getElementById('minimap-dock-destination') : null;
        if (dockElement) {
            return createPortal(
                <div className="w-full h-full relative group">
                    <MiniMap {...miniMapProps} />
                </div>,
                dockElement
            );
        }
        // dockElement가 없으면 (팔레트가 닫혀있거나 로딩 중이면) 플로팅 모드로 fallback
    }

    // 마운트 전에는 렌더링하지 않음 (SSR/Hydration 방지)
    if (!isMounted) return null;

    // 플로팅 모드일 때: 드래그 가능한 박스
    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                zIndex: 100, // 패널보다 위에 오도록 상향
                width: 320,
                height: 240,
            }}
            className={cn(
                'flex flex-col rounded-xl overflow-hidden shadow-2xl transition-shadow',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'nopan pointer-events-auto',
                isDragging ? 'shadow-xl scale-[1.02] cursor-grabbing' : '',
                isDockZone && isDragging ? 'ring-4 ring-indigo-500/50 border-indigo-500' : ''
            )}
        >
            <div
                onMouseDown={handleMouseDown}
                className={cn(
                    'flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none',
                    'backdrop-blur-sm',
                    isDockZone && isDragging ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                )}
            >
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100 truncate pr-2">
                    <GripHorizontal className="w-4 h-4 text-indigo-500" />
                    <span className="truncate tracking-tight">{surveyTitle}</span>
                </div>

                {isDockZone && isDragging && (
                    <span className="text-xs font-bold text-indigo-600 animate-pulse">
                        여기에 놓아서 도킹
                    </span>
                )}
            </div>

            {/* React Flow MiniMap */}
            <div className="flex-1 relative">
                <MiniMap {...miniMapProps} />
            </div>
        </div>
    );
}
