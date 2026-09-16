"use client";

import { Repeat } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatFullDate } from "@/lib/date";
import { formatAmount } from "@/lib/money";
import type { RecurringResponse } from "@/types/api";

/**
 * 고정지출 자동 감지 (STAT-06).
 *
 * ⚠️ "등록" 버튼을 두지 않는다. 읽기 전용 안내다.
 *    DB 에 쓰기 시작하면 사용자가 지운 항목이 다음 달에 되살아나는 문제를 처리해야 하고,
 *    그 순간 반복 거래 기능을 만드는 것과 같아진다.
 *
 * ⚠️ 본문과 다른 요청으로 늦게 도착하므로 카드 높이를 미리 잡아둔다.
 *    스켈레톤과 본문이 같은 min-height 를 쓰지 않으면 데이터가 도착할 때 내용이 밀린다.
 *    감지 항목이 보통 3건 안팎이라 그 높이(약 177px)를 덮도록 192px 를 잡았다.
 *    min-h-44(176px)로는 3건에서 이미 1px 이 모자라 미세하게 밀렸다.
 *
 *    그보다 많은 항목이 오면 카드가 더 늘어나지만, 이 카드를 페이지 맨 아래에 두어
 *    위쪽에서 이미 읽고 있던 내용은 어떤 경우에도 움직이지 않는다.
 */
const CARD_CLASS = "flex min-h-48 flex-col gap-2 rounded-xl border border-border p-5";

interface RecurringCardProps {
  data: RecurringResponse[] | undefined;
  isPending: boolean;
}

export function RecurringCard({ data, isPending }: RecurringCardProps) {
  if (isPending) {
    return (
      <div className={CARD_CLASS} aria-busy="true" aria-label="고정지출 불러오는 중">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    );
  }

  const items = data ?? [];
  const total = items.reduce((acc, item) => acc + item.medianAmount, 0);

  return (
    <div className={CARD_CLASS}>
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <Repeat className="size-4" aria-hidden />
        고정지출로 보이는 거래
      </span>

      {items.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          3개월 연속 같은 거래처·비슷한 금액으로 나가는 항목이 아직 없어요.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {items.map((item) => (
              <li key={item.merchant} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-body">{item.merchant}</span>
                <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
                  {formatAmount(item.medianAmount)}원 · {item.monthsSeen}개월 ·{" "}
                  {formatFullDate(item.lastDate)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-auto text-caption text-muted-foreground tabular-nums">
            합계 {formatAmount(total)}원
          </p>
        </>
      )}
    </div>
  );
}
