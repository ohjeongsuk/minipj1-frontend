"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * 되돌리기 어려운 동작 앞에 세우는 확인창.
 *
 * 카테고리 화면에만 있던 마크업을 빼내 거래 삭제에서도 함께 쓴다.
 * 같은 질문을 화면마다 다르게 물으면 사용자가 매번 다시 읽어야 한다.
 *
 * ⚠️ open 을 호출부가 들고 있는다. "무엇을 지우는가" 는 화면이 알고
 *    이 컴포넌트는 모른다 — 대상 상태를 여기로 올리면 화면마다
 *    다른 타입이 필요해져 공용이 되지 못한다.
 *
 * ⚠️ 바깥 클릭·Esc 로 닫히면 취소로 본다. 확인창의 기본 동작이고,
 *    닫는 것이 곧 "안 지운다" 라 안전한 쪽으로 떨어진다.
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** 무엇이 사라지고 무엇이 남는지 적는다. 없으면 제목만 나온다 */
  description?: ReactNode;
  /** 기본은 "삭제". 지우기가 아닌 동작이면 바꿔 쓴다 */
  confirmLabel?: string;
  /** 요청 중에는 버튼을 잠가 두 번 눌리지 않게 한다 */
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "삭제",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onCancel())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
