"use client";

import { formatAmount } from "@/lib/money";

import { ChartAxis, niceCeil } from "./ChartAxis";
import type { ChartDatum } from "./types";

/**
 * 일별 세로 막대 차트.
 *
 * 선 차트는 점과 점을 이어 "그 사이에도 값이 있다" 고 말하지만, 일별 지출은
 * 3일에 5만원 · 4일에 0원인 이산값이다. 막대는 없는 값을 만들어내지 않는다.
 *
 * ⚠️ SVG 를 쓰지 않는다. 높이를 % 로 주는 div 면 충분하고, 그래야
 *    TrendLine 이 preserveAspectRatio="none" 때문에 겪는 찌그러짐이 없다.
 *    props 모양은 TrendLine 과 같아 화면이 둘을 바꿔 끼울 수 있다.
 *
 * ⚠️ 지출이 0 인 날은 막대 높이가 0 이라 보이지 않는다. 의도된 동작이다 —
 *    "그날은 쓰지 않았다" 가 빈칸으로 읽히는 것이 막대 차트의 쓸모다.
 *
 * ⚠️ 높이는 고정이 아니라 최소값이다. 옆 칸의 히트맵이 더 높아 카드가 늘어나면
 *    그만큼 따라 늘어난다. 막대·눈금이 전부 % 라 별도 계산이 필요 없다.
 */
interface DailyBarProps {
  data: ChartDatum[];
  /** 최소 높이. 카드에 남는 자리가 있으면 그만큼 늘어난다 */
  height?: number;
  /** 스크린리더용 설명. 무엇의 추이인지는 화면이 정한다 */
  label?: string;
  /** 축 라벨의 단위. 기본은 원 */
  unit?: string;
}

export function DailyBar({ data, height = 200, label = "추이", unit = "원" }: DailyBarProps) {
  if (data.length === 0) {
    return null;
  }

  const values = data.map((d) => d.value);
  const total = values.reduce((sum, v) => sum + v, 0);
  const max = niceCeil(Math.max(...values, 0));

  const peakIndex = values.indexOf(Math.max(...values));
  const peak = data[peakIndex];

  return (
    <figure
      className="flex min-h-0 flex-1 flex-col gap-1.5"
      role="img"
      aria-label={
        `${label}. ${data.length}일 동안 합계 ${formatAmount(total)}${unit}, ` +
        `가장 많이 쓴 날은 ${peak.name}일 ${formatAmount(peak.value)}${unit}`
      }
    >
      {/* 세로축 라벨이 차지할 자리를 padding 으로 비워 둔다. "200,000원" 이 들어갈 폭이다 */}
      <div className="relative flex-1 pl-20" style={{ minHeight: height }}>
        <ChartAxis max={max} unit={unit} />

        {/* 막대는 격자선 위에 얹는다. items-end 라 바닥에서 자란다 */}
        <div className="absolute inset-y-0 right-0 left-20 flex items-end gap-px">
          {data.map((datum, index) => (
            <div
              key={`${datum.name}-${index}`}
              title={`${datum.name}일 · ${formatAmount(datum.value)}${unit}`}
              /*
               * 최고점을 따로 표시하지 않는다. 막대 차트에서는 가장 높은 막대가
               * 이미 최고점이고, 선 차트와 달리 눈으로 바로 찾을 수 있다.
               * 차트 막대만 예외적으로 200ms 를 넘긴다 (CLAUDE.md 8장)
               */
              className="min-w-px flex-1 rounded-t-sm bg-primary transition-[height] duration-300"
              style={{ height: `${(datum.value / max) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* 가로축 라벨. 모든 날짜를 적으면 겹치므로 처음·중간·마지막 셋만 둔다 */}
      <div className="flex justify-between pl-20 text-caption text-muted-foreground tabular-nums">
        <span>{data[0].name}일</span>
        {data.length > 2 ? <span>{data[Math.floor((data.length - 1) / 2)].name}일</span> : null}
        {data.length > 1 ? <span>{data[data.length - 1].name}일</span> : null}
      </div>
    </figure>
  );
}
