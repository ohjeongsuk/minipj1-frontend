"use client";

import { cn } from "cn";

import { formatAmount } from "@/lib/money";
import type { StatsSummary } from "@/types/api";

/**
 * 총수입 · 총지출 · 잔액 (STAT-01).
 *
 * 수입 초록 · 지출 빨강은 단일 액센트 규칙의 예외다.
 * 금액의 방향을 색으로 구분하는 것이 이 앱의 핵심 정보이기 때문이다.
 * 잔액은 음수일 때만 빨강으로 바뀐다.
 */
export function SummaryCards({ summary }: { summary: StatsSummary }) {
  const items = [
    { label: "총수입", value: summary.income, className: "text-income" },
    { label: "총지출", value: summary.expense, className: "text-expense" },
    {
      label: "잔액",
      value: summary.net,
      className: summary.net < 0 ? "text-expense" : "text-foreground",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1 rounded-xl border border-border p-5">
          <span className="text-caption text-muted-foreground">{item.label}</span>
          <span className={cn("text-2xl font-semibold tabular-nums", item.className)}>
            {formatAmount(item.value)}원
          </span>
        </div>
      ))}
    </div>
  );
}
