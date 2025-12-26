'use client';

// components/shared/ConfirmDialog.tsx - 확인 다이얼로그

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore, useUIActions } from '@/stores';

export function ConfirmDialog() {
  const isOpen = useUIStore((state) => state.isConfirmDialogOpen);
  const data = useUIStore((state) => state.confirmDialogData);
  const uiActions = useUIActions();

  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => uiActions.closeConfirmDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          <DialogDescription>{data.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => uiActions.closeConfirmDialog()}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={data.onConfirm}
            data-testid="confirm-delete"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
