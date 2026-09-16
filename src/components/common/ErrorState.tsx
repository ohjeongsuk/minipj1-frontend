"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 인라인 에러 카드.
 *
 * ⚠️ onRetry 는 선택이 아니라 필수 prop 이다.
 *    재시도 버튼 없는 에러 화면은 사용자를 막다른 길에 세운다(UX-04).
 *    선택으로 두면 급할 때 빠뜨리게 되므로 타입으로 강제한다.
 */
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  /** 재시도가 진행 중인지 */
  retrying?: boolean;
}

export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border px-6 py-12 text-center"
    >
      <TriangleAlert className="size-8 text-destructive" aria-hidden />
      <p className="text-body">{message}</p>
      <Button variant="outline" onClick={onRetry} disabled={retrying} className="mt-1">
        <RotateCcw className="size-4" aria-hidden />
        {retrying ? "다시 불러오는 중…" : "다시 시도"}
      </Button>
    </div>
  );
}
