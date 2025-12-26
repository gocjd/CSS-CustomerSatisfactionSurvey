// stores/useHistoryStore.ts - Undo/Redo 히스토리 관리

import { create } from 'zustand';
import type { SurveyNode, SurveyEdge } from '@/types';

interface HistoryEntry {
  nodes: SurveyNode[];
  edges: SurveyEdge[];
  timestamp: number;
}

interface HistoryState {
  past: HistoryEntry[];
  present: HistoryEntry | null;
  future: HistoryEntry[];
  maxHistory: number;
}

interface HistoryActions {
  // 현재 상태 저장
  saveState: (nodes: SurveyNode[], edges: SurveyEdge[]) => void;

  // Undo
  undo: () => HistoryEntry | null;

  // Redo
  redo: () => HistoryEntry | null;

  // 히스토리 초기화
  clear: () => void;

  // 상태 확인
  canUndo: () => boolean;
  canRedo: () => boolean;
}

type HistoryStore = HistoryState & { actions: HistoryActions };

const MAX_HISTORY = 50;

const initialState: HistoryState = {
  past: [],
  present: null,
  future: [],
  maxHistory: MAX_HISTORY,
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  ...initialState,

  actions: {
    saveState: (nodes, edges) => {
      const { past, present, maxHistory } = get();

      const newPresent = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
      };

      // 처음 저장하는 경우 present만 설정
      if (!present) {
        set({ present: newPresent });
        return;
      }

      // 변경 사항이 없는 경우 중복 저장 방지 (선택 사항인데 여기서는 그냥 저장)
      const newPast = [...past, present];
      if (newPast.length > maxHistory) {
        newPast.shift();
      }

      set({
        past: newPast,
        present: newPresent,
        future: [], // 새 액션이 발생하면 redo 불가
      });
    },

    undo: () => {
      const { past, present, future } = get();
      if (past.length === 0) return null;

      const newPast = [...past];
      const previous = newPast.pop()!;

      const newFuture = present ? [present, ...future] : future;

      set({
        past: newPast,
        present: previous,
        future: newFuture,
      });

      return previous;
    },

    redo: () => {
      const { past, present, future } = get();
      if (future.length === 0) return null;

      const newFuture = [...future];
      const next = newFuture.shift()!;

      const newPast = present ? [...past, present] : past;

      set({
        past: newPast,
        present: next,
        future: newFuture,
      });

      return next;
    },

    clear: () => {
      set(initialState);
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  },
}));

// 액션 셀렉터
export const useHistoryActions = () => useHistoryStore((state) => state.actions);
