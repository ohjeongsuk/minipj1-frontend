"use client";

import { formatAmount } from "@/lib/money";

import type { ChartDatum } from "./types";

/**
 * 월별 추이 선.
 * SVG polyline 으로 그린다. 데이터 포인트가 6~12개뿐이라 라이브러리가 필요 없다.
 */
interface TrendLineProps {
  data: ChartDatum[];
  height?: number;
}

const PADDING = { top: 12, right: 8, bottom: 22, left: 8 };

export function TrendLine({ data, height = 140 }: TrendLineProps) {
  if (data.length === 0) {
    return null;
  }

  // viewBox 를 고정하고 preserveAspectRatio 로 늘린다. 너비를 몰라도 반응형이 된다
  const width = 320;
  const innerWidth = width - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = data.map((datum, index) => ({
    x: PADDING.left + stepX * index,
    y: PADDING.top + innerHeight * (1 - datum.value / max),
    datum,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${PADDING.left},${PADDING.top + innerHeight} ${polyline} ${
    PADDING.left + stepX * (data.length - 1)
  },${PADDING.top + innerHeight}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-[140px] w-full"
      role="img"
      aria-label={`월별 추이. 최근 값 ${formatAmount(data[data.length - 1].value)}원`}
    >
      <polygon points={area} fill="var(--color-primary)" opacity={0.08} />
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((point, index) => (
        <circle
          key={`${point.datum.name}-${index}`}
          cx={point.x}
          cy={point.y}
          r={3}
          fill="var(--color-card)"
          stroke="var(--color-primary)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
