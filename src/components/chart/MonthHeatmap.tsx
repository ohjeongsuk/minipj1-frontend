"use client";

import { formatAmount } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * 일별 지출 캘린더 히트맵.
 * CSS grid-cols-7 + 배경색 단계로 그린다. Recharts 에 애초에 이런 차트가 없다.
 */
export interface HeatmapDatum {
  /** yyyy-MM-dd */
  date: string;
  value: number;
}

interface MonthHeatmapProps {
  data: HeatmapDatum[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 0~1 비율을 5단계로 나눈다. 0 은 빈 칸으로 둔다 */
function level(ratio: number): number {
  if (ratio <= 0) return 0;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

const LEVEL_OPACITY = [0, 0.18, 0.38, 0.62, 1];

export function MonthHeatmap({ data }: MonthHeatmapProps) {
  if (data.length === 0) {
    return null;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  // 1일이 무슨 요일인지에 따라 앞을 비운다
  const firstWeekday = new Date(`${data[0].date}T00:00:00`).getDay();

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1 text-center text-caption text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden />
        ))}
        {data.map((datum) => {
          const opacity = LEVEL_OPACITY[level(datum.value / max)];
          const day = Number(datum.date.slice(-2));
          return (
            <div
              key={datum.date}
              title={`${datum.date} · ${formatAmount(datum.value)}원`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border border-border text-caption tabular-nums",
              )}
              style={{
                backgroundColor:
                  opacity > 0 ? `color-mix(in srgb, var(--color-expense) ${opacity * 100}%, transparent)` : undefined,
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
