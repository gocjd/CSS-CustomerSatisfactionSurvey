// stores/useUIStore.ts - UI 상태 관리

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type PropertyPanelTab = 'basic' | 'options' | 'validation' | 'branching' | 'style';
export type PanelPosition = 'left' | 'right';

interface UIState {
  // 패널 상태
  isPaletteOpen: boolean;
  isPropertyPanelOpen: boolean;
  propertyPanelTab: PropertyPanelTab;

  // 뷰 상태
  zoom: number;
  isDarkMode: boolean;

  // 모달 상태
  isExportModalOpen: boolean;
  isImportModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isConfirmDialogOpen: boolean;
  confirmDialogData: {
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;

  // 토스트/알림
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  };

  // 드래그 상태
  isDragging: boolean;
  draggedItemType: string | null;

  // 컨텍스트 메뉴
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
  };
}

interface UIActions {
  // 패널
  togglePalette: () => void;
  togglePropertyPanel: () => void;
  setPropertyPanelTab: (tab: PropertyPanelTab) => void;
  openPropertyPanel: () => void;
  closePropertyPanel: () => void;

  // 뷰
  setZoom: (zoom: number) => void;
  toggleDarkMode: () => void;

  // 모달
  openExportModal: () => void;
  closeExportModal: () => void;
  openImportModal: () => void;
  closeImportModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // 확인 다이얼로그
  showConfirmDialog: (data: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => void;
  closeConfirmDialog: () => void;

  // 토스트
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;

  // 드래그
  setDragging: (isDragging: boolean, itemType?: string) => void;

  // 컨텍스트 메뉴
  openContextMenu: (position: { x: number; y: number }, nodeId: string | null) => void;
  closeContextMenu: () => void;
}

type UIStore = UIState & { actions: UIActions };

const initialState: UIState = {
  isPaletteOpen: true,
  isPropertyPanelOpen: false,
  propertyPanelTab: 'basic',

  zoom: 1,
  isDarkMode: false,

  isExportModalOpen: false,
  isImportModalOpen: false,
  isSettingsModalOpen: false,
  isConfirmDialogOpen: false,
  confirmDialogData: null,

  toast: {
    message: '',
    type: 'info',
    isVisible: false,
  },

  isDragging: false,
  draggedItemType: null,

  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    nodeId: null,
  },
};

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    ...initialState,

    actions: {
      togglePalette: () => {
        set((state) => {
          state.isPaletteOpen = !state.isPaletteOpen;
        });
      },

      togglePropertyPanel: () => {
        set((state) => {
          state.isPropertyPanelOpen = !state.isPropertyPanelOpen;
        });
      },

      setPropertyPanelTab: (tab) => {
        set((state) => {
          state.propertyPanelTab = tab;
        });
      },

      openPropertyPanel: () => {
        set((state) => {
          state.isPropertyPanelOpen = true;
        });
      },

      closePropertyPanel: () => {
        set((state) => {
          state.isPropertyPanelOpen = false;
        });
      },

      setZoom: (zoom) => {
        set((state) => {
          state.zoom = Math.max(0.1, Math.min(2, zoom));
        });
      },

      toggleDarkMode: () => {
        set((state) => {
          state.isDarkMode = !state.isDarkMode;
        });
      },

      openExportModal: () => {
        set((state) => {
          state.isExportModalOpen = true;
        });
      },

      closeExportModal: () => {
        set((state) => {
          state.isExportModalOpen = false;
        });
      },

      openImportModal: () => {
        set((state) => {
          state.isImportModalOpen = true;
        });
      },

      closeImportModal: () => {
        set((state) => {
          state.isImportModalOpen = false;
        });
      },

      openSettingsModal: () => {
        set((state) => {
          state.isSettingsModalOpen = true;
        });
      },

      closeSettingsModal: () => {
        set((state) => {
          state.isSettingsModalOpen = false;
        });
      },

      showConfirmDialog: (data) => {
        set((state) => {
          state.isConfirmDialogOpen = true;
          state.confirmDialogData = data;
        });
      },

      closeConfirmDialog: () => {
        set((state) => {
          state.isConfirmDialogOpen = false;
          state.confirmDialogData = null;
        });
      },

      showToast: (message, type = 'info') => {
        set((state) => {
          state.toast = { message, type, isVisible: true };
        });

        // 3초 후 자동 숨김
        setTimeout(() => {
          set((state) => {
            state.toast.isVisible = false;
          });
        }, 3000);
      },

      hideToast: () => {
        set((state) => {
          state.toast.isVisible = false;
        });
      },

      setDragging: (isDragging, itemType) => {
        set((state) => {
          state.isDragging = isDragging;
          state.draggedItemType = isDragging ? (itemType || null) : null;
        });
      },

      openContextMenu: (position, nodeId) => {
        set((state) => {
          state.contextMenu = {
            isOpen: true,
            position,
            nodeId,
          };
        });
      },

      closeContextMenu: () => {
        set((state) => {
          state.contextMenu.isOpen = false;
        });
      },
    },
  }))
);

// 액션 셀렉터
export const useUIActions = () => useUIStore((state) => state.actions);
