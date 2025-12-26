'use client';

// components/shared/Toast.tsx - 토스트 알림

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore, useUIActions } from '@/stores';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function Toast() {
  const toast = useUIStore((state) => state.toast);
  const uiActions = useUIActions();

  if (!toast.isVisible) return null;

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'flex items-center gap-3 px-4 py-3',
        'rounded-xl border shadow-lg',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        colors[toast.type]
      )}
      data-testid="toast"
    >
      <Icon className={cn('w-5 h-5', iconColors[toast.type])} />
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => uiActions.hideToast()}
        className="ml-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
