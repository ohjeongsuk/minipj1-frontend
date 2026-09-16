"use client";

import { formatAmount } from "@/lib/money";

import { resolveColor, type ChartDatum } from "./types";

/**
 * 카테고리별 지출 도넛.
 * SVG circle + stroke-dasharray 로 그린다. 도넛 하나에 라이브러리 100KB 를 넣을 이유가 없다.
 */
interface CategoryDonutProps {
  data: ChartDatum[];
  /** 가운데에 표시할 총액. 생략하면 data 합계를 쓴다 */
  total?: number;
  size?: number;
}

const STROKE = 18;

export function CategoryDonut({ data, total, size = 180 }: CategoryDonutProps) {
  const sum = total ?? data.reduce((acc, d) => acc + d.value, 0);
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  // 누적 오프셋으로 조각을 이어 붙인다
  let offset = 0;
  const segments = data.map((datum, index) => {
    const ratio = sum > 0 ? datum.value / sum : 0;
    const segment = {
      key: `${datum.name}-${index}`,
      color: resolveColor(datum.color, index),
      dash: ratio * circumference,
      offset,
      name: datum.name,
      value: datum.value,
    };
    offset += segment.dash;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`카테고리별 지출 합계 ${formatAmount(sum)}원`}
      >
        {/* 배경 링 — 데이터가 없을 때도 형태가 보인다 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
        />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
            />
          ))}
        </g>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-item font-semibold tabular-nums"
        >
          {formatAmount(sum)}
        </text>
      </svg>

      {/* 범례 — 텍스트를 색 위에 올리지 않고 색 옆에 둔다(대비 계산이 불가능하다) */}
      <ul className="flex w-full flex-col gap-2 sm:w-auto">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-caption">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            <span className="flex-1 truncate">{segment.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatAmount(segment.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
