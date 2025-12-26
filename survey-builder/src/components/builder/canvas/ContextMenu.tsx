'use client';

// components/builder/canvas/ContextMenu.tsx - 노드 컨텍스트 메뉴

import { useEffect, useRef } from 'react';
import { Copy, Trash2, Edit, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSurveyActions } from '@/stores';
import { useUIActions } from '@/stores';
import { useHistoryActions } from '@/stores';
import { useSurveyStore } from '@/stores';

interface ContextMenuProps {
  position: { x: number; y: number };
  nodeId: string | null;
  onClose: () => void;
}

export function ContextMenu({ position, nodeId, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const nodes = useSurveyStore((state) => state.nodes);
  const edges = useSurveyStore((state) => state.edges);

  const surveyActions = useSurveyActions();
  const uiActions = useUIActions();
  const historyActions = useHistoryActions();

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!nodeId) return null;

  const handleEdit = () => {
    surveyActions.selectNode(nodeId);
    uiActions.openPropertyPanel();
    onClose();
  };

  const handleDuplicate = () => {
    // TODO: 노드 복제 구현
    uiActions.showToast('복제 기능 준비 중', 'info');
    onClose();
  };

  const handleDelete = () => {
    uiActions.showConfirmDialog({
      title: '질문 삭제',
      message: '이 질문을 삭제하시겠습니까? 연결된 흐름도 함께 삭제됩니다.',
      onConfirm: () => {
        surveyActions.deleteNode(nodeId);
        historyActions.saveState(nodes, edges);
        uiActions.showToast('질문이 삭제되었습니다.', 'success');
        uiActions.closeConfirmDialog();
      },
    });
    onClose();
  };

  const menuItems = [
    {
      icon: Edit,
      label: '편집',
      onClick: handleEdit,
      shortcut: 'Enter',
    },
    {
      icon: Copy,
      label: '복제',
      onClick: handleDuplicate,
      shortcut: 'Ctrl+D',
    },
    { type: 'separator' as const },
    {
      icon: Trash2,
      label: '삭제',
      onClick: handleDelete,
      shortcut: 'Delete',
      danger: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50',
        'min-w-[180px] py-1.5',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-xl shadow-xl',
        'animate-in fade-in zoom-in-95 duration-100'
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      data-testid="context-menu"
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div
              key={index}
              className="my-1.5 h-px bg-gray-200 dark:bg-gray-700"
            />
          );
        }

        const Icon = item.icon;

        return (
          <button
            key={index}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2',
              'text-sm text-left',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'transition-colors duration-100',
              item.danger && 'text-red-600 dark:text-red-400'
            )}
            onClick={item.onClick}
            data-testid={`context-menu-${item.label.toLowerCase()}`}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-400">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
