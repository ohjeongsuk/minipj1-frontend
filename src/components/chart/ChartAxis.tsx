"use client";

import { formatAmountShort } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * 세로축 눈금과 격자선. 선·막대 차트가 함께 쓴다.
 *
 * ⚠️ 두 차트가 반드시 같은 축을 써야 한다. 그래프 종류만 바꿨는데 눈금이 달라지면
 *    데이터까지 바뀐 것처럼 보인다. niceCeil 을 각 차트에 복사해 두지 않고
 *    여기 한 곳에 두는 이유가 그것이다.
 *
 * ⚠️ 부모가 `relative pl-20` 이라고 가정한다. 왼쪽 5rem 이 라벨 자리이고,
 *    격자선은 그 오른쪽(left-20)부터 그린다.
 *
 * ⚠️ 눈금은 0 과 최댓값 사이를 균등 분할하지 않고 0 · 중간 · 최댓값 셋만 둔다.
 *    격자선이 많아지면 정작 읽어야 할 선보다 눈에 먼저 들어온다.
 */

/** 0 · 중간 · 최댓값 */
export const TICK_RATIOS = [1, 0.5, 0];

/**
 * 축 최댓값을 읽기 좋은 수로 올린다. 1 · 2 · 2.5 · 5 × 10^n 중 하나가 된다.
 *
 * 데이터 최댓값을 그대로 쓰면 눈금이 168,336 / 84,168 처럼 나와
 * "얼마쯤인가" 를 가늠하는 데 오히려 머리를 쓰게 된다.
 * 200,000 / 100,000 이면 한눈에 읽힌다.
 *
 * 덤으로 최고점이 천장에 닿지 않아 최고점 라벨이 카드 밖으로 밀리지 않는다.
 */
export function niceCeil(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

interface ChartAxisProps {
  /** niceCeil 을 통과한 세로축 최댓값 */
  max: number;
  unit?: string;
}

export function ChartAxis({ max, unit = "원" }: ChartAxisProps) {
  return (
    <>
      {TICK_RATIOS.map((ratio) => (
        <span
          key={`tick-${ratio}`}
          className="absolute left-0 w-[4.5rem] -translate-y-1/2 text-right text-caption text-muted-foreground tabular-nums"
          style={{ top: `${(1 - ratio) * 100}%` }}
        >
          {formatAmountShort(max * ratio)}
          {unit}
        </span>
      ))}

      {TICK_RATIOS.map((ratio) => (
        <span
          key={`line-${ratio}`}
          aria-hidden
          // 바닥선만 실선이다. 중간 눈금까지 실선이면 어느 쪽이 0 인지 흐려진다
          className={cn(
            "pointer-events-none absolute right-0 left-20 border-t border-border",
            ratio === 0 ? "border-solid" : "border-dashed",
          )}
          style={{ top: `${(1 - ratio) * 100}%` }}
        />
      ))}
    </>
  );
}
