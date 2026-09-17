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
  /**
   * 범례에 함께 보여줄 정수 퍼센트. data 와 같은 순서여야 한다.
   * 합이 100 이 되도록 배분하는 책임은 호출부(lib/percent)에 있다 —
   * 각 비율을 따로 반올림하면 합이 99% 나 101% 로 보인다.
   */
  percents?: number[];
}

const STROKE = 18;

export function CategoryDonut({ data, total, size = 160, percents }: CategoryDonutProps) {
  const sum = total ?? data.reduce((acc, d) => acc + d.value, 0);
  /*
   * ⚠️ 1px 을 빼는 것이 핵심이다.
   *    (size - STROKE) / 2 로 두면 링의 바깥 가장자리가 중심에서 정확히 size/2 가 되어
   *    viewBox 경계와 딱 맞닿는다. <svg> 는 기본이 overflow:hidden 이라
   *    안티앨리어싱된 바깥 한 픽셀이 깎여 나가고, 링 테두리가 미세하게 잘려 보인다.
   */
  const radius = (size - STROKE) / 2 - 1;
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

  /*
   * ⚠️ 가로 배치를 sm 이 아니라 lg 에서 켠다. 대시보드는 sm 에서 카드를 2열로
   *    나누므로, 정작 sm 이 되는 순간 이 카드는 반쪽(약 290px)이 되어 더 좁아진다.
   *    그때 가로로 눕히면 도넛 160px 를 빼고 범례에 66px 만 남아 카테고리명이
   *    0px 로 찌부러진다. 카드가 실제로 넓어지는 것은 lg 부터다.
   */
  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-6">
      {/*
        ⚠️ shrink-0 이 없으면 width 속성이 지켜지지 않는다.
           flex 항목의 기본값이 flex-shrink:1 이라, 옆 범례(w-full)와 자리를 다투면
           SVG 가 가로로만 줄어든다. viewBox 가 있어 내용은 비율을 지키며 축소되므로
           원이 찌그러지지는 않지만, 도넛이 작아지고 위아래에 빈 띠가 생겨
           "잘린 것처럼" 보인다. 실측으로 지정한 180px 가 120.8px 까지 밀린 적이 있다.
      */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
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
      <ul className="flex w-full min-w-0 flex-col gap-2">
        {segments.map((segment, index) => (
          <li key={segment.key} className="flex items-center gap-2 text-caption">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{segment.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatAmount(segment.value)}원
              {percents ? ` · ${percents[index]}%` : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
