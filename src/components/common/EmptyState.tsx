import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 빈 상태. 아이콘 + 문구 + CTA.
 *
 * "검색 결과 없음"과 "아직 데이터 없음"은 문구를 구분한다.
 * 같은 문구를 쓰면 사용자가 필터를 걸어둔 사실을 알아채지 못한다.
 */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border px-6 py-14 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-item font-semibold">{title}</p>
      {description ? (
        <p className="max-w-sm text-caption text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
