"use client";

import { formatAmount, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { resolveColor, type ChartDatum } from "./types";

/**
 * 카테고리별 지출 / 예산 소진율 막대.
 * div 너비를 % 로 준다. 축·툴팁·범례가 전부 불필요해 라이브러리가 오히려 방해가 된다.
 */
interface BudgetBarProps {
  data: ChartDatum[];
  /** 각 항목의 상한. 없으면 data 중 최댓값을 기준으로 상대 길이를 그린다 */
  max?: number;
  /** 소진율 표시 여부 (예산 화면에서 true) */
  showRatio?: boolean;
}

export function BudgetBar({ data, max, showRatio = false }: BudgetBarProps) {
  const ceiling = max ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="flex flex-col gap-3">
      {data.map((datum, index) => {
        const ratio = ceiling > 0 ? datum.value / ceiling : 0;
        const exceeded = ratio > 1;
        const color = resolveColor(datum.color, index);

        return (
          <li key={`${datum.name}-${index}`} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-caption">
              <span className="truncate">{datum.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatAmount(datum.value)}
                {showRatio ? ` · ${formatPercent(ratio)}` : null}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-valuenow={Math.round(ratio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${datum.name} ${formatPercent(ratio)}`}
            >
              {/* 차트 막대만 예외적으로 200ms 를 넘긴다 (CLAUDE.md 8장) */}
              <div
                className={cn("h-full rounded-full transition-[width] duration-300")}
                style={{
                  width: `${Math.min(100, ratio * 100)}%`,
                  backgroundColor: exceeded ? "var(--color-expense)" : color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
