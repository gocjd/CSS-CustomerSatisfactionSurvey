'use client';

// components/builder/palette/QuestionPalette.tsx - 질문 팔레트

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useUIActions } from '@/stores';
import { PaletteItem } from './PaletteItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { QuestionType } from '@/types';

interface PaletteItemData {
  type: QuestionType;
  label: string;
  description: string;
  icon: 'list' | 'text' | 'mic';
}

const paletteItems: PaletteItemData[] = [
  {
    type: 'multiple_choice',
    label: '객관식',
    description: '단일 또는 복수 선택',
    icon: 'list',
  },
  {
    type: 'text_opinion',
    label: '텍스트 의견',
    description: '자유 텍스트 입력',
    icon: 'text',
  },
  {
    type: 'voice_opinion',
    label: '음성 의견',
    description: '음성 녹음 답변',
    icon: 'mic',
  },
];

export function QuestionPalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const isPaletteOpen = useUIStore((state) => state.isPaletteOpen);
  const uiActions = useUIActions();

  const filteredItems = paletteItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn(
        'relative flex flex-col h-full',
        'bg-white dark:bg-gray-900',
        'border-r border-gray-200 dark:border-gray-800',
        'transition-all duration-300 ease-in-out',
        isPaletteOpen ? 'w-64' : 'w-12'
      )}
      data-testid="question-palette"
    >
      {/* 토글 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute -right-3 top-4 z-10',
          'w-6 h-6 rounded-full',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'shadow-md hover:shadow-lg',
          'transition-all duration-200'
        )}
        onClick={() => uiActions.togglePalette()}
        data-testid="palette-toggle"
      >
        {isPaletteOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>

      {isPaletteOpen ? (
        <>
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              질문 유형
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* 팔레트 아이템 목록 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredItems.map((item) => (
              <PaletteItem
                key={item.type}
                type={item.type}
                label={item.label}
                description={item.description}
                icon={item.icon}
              />
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {/* 도움말 */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              질문을 드래그하여 캔버스에 추가하세요.
            </p>
          </div>
        </>
      ) : (
        // 축소된 상태
        <div className="flex flex-col items-center gap-2 pt-12">
          {paletteItems.map((item) => (
            <PaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              description={item.description}
              icon={item.icon}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
