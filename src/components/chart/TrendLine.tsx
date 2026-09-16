"use client";

import { formatAmount } from "@/lib/money";

import type { ChartDatum } from "./types";

/**
 * 추이 선 차트.
 *
 * 데이터 포인트가 수십 개뿐이라 라이브러리가 필요 없다.
 * props 는 Recharts 의 <Line data={...} dataKey="value" /> 와 같은 모양으로 둔다.
 *
 * ⚠️ 선·영역·격자선만 SVG 로 그리고 글자와 점은 HTML 로 얹는다.
 *    너비를 모르는 채 반응형으로 만들려면 preserveAspectRatio="none" 이 필요한데,
 *    그러면 SVG 안의 글자와 원이 가로로 늘어나 찌그러진다.
 *    늘어나도 괜찮은 것(선·면)만 SVG 에 두고 나머지는 밖으로 뺀다.
 *
 * ⚠️ 눈금은 0 과 최댓값 사이를 균등 분할하지 않고 0 · 중간 · 최댓값 셋만 둔다.
 *    격자선이 많아지면 정작 읽어야 할 선보다 눈에 먼저 들어온다.
 */
interface TrendLineProps {
  data: ChartDatum[];
  height?: number;
  /** 스크린리더용 설명. 무엇의 추이인지는 화면이 정한다 */
  label?: string;
  /** 축 라벨의 단위. 기본은 원 */
  unit?: string;
}

/** 0 · 중간 · 최댓값 */
const TICK_RATIOS = [1, 0.5, 0];

/**
 * 축 최댓값을 읽기 좋은 수로 올린다. 1 · 2 · 2.5 · 5 × 10^n 중 하나가 된다.
 *
 * 데이터 최댓값을 그대로 쓰면 눈금이 168,336 / 84,168 처럼 나와
 * "얼마쯤인가" 를 가늠하는 데 오히려 머리를 쓰게 된다.
 * 200,000 / 100,000 이면 한눈에 읽힌다.
 *
 * 덤으로 최고점이 천장에 닿지 않아 최고점 라벨이 카드 밖으로 밀리지 않는다.
 */
function niceCeil(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function TrendLine({ data, height = 200, label = "추이", unit = "원" }: TrendLineProps) {
  if (data.length === 0) {
    return null;
  }

  const values = data.map((d) => d.value);
  const dataMax = Math.max(...values, 0);
  const total = values.reduce((sum, v) => sum + v, 0);
  // 선의 높이와 눈금이 같은 기준을 써야 격자선 위에 정확히 얹힌다
  const max = niceCeil(dataMax);

  // 최고점은 하나만 표시한다. 같은 값이 여러 개면 첫 번째를 쓴다
  const peakIndex = values.indexOf(Math.max(...values));
  const peak = data[peakIndex];

  /** 0~100(%) 좌표. viewBox 가 아니라 비율로 두어야 HTML 과 SVG 가 같은 자리를 가리킨다 */
  const pos = (index: number) => ({
    x: data.length > 1 ? (index / (data.length - 1)) * 100 : 50,
    y: (1 - data[index].value / max) * 100,
  });

  const points = data.map((_, i) => pos(i));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${points[0].x},100 ${polyline} ${points[points.length - 1].x},100`;

  const peakPos = pos(peakIndex);
  // 최고점 라벨이 왼쪽/오른쪽 끝에서 잘리지 않도록 붙는 방향을 바꾼다
  const peakAnchor = peakPos.x > 70 ? "right" : "left";
  /*
   * 최고점은 정의상 세로축 최댓값과 같은 높이다. 라벨을 점 위에 두면
   * 차트 영역 밖으로 나가 제목과 겹친다. 위쪽에 붙는 경우에는 아래로 뒤집는다.
   */
  const peakBelow = peakPos.y < 25;

  return (
    <figure
      className="flex flex-col gap-1.5"
      role="img"
      aria-label={
        `${label}. ${data.length}일 동안 합계 ${formatAmount(total)}${unit}, ` +
        `가장 많이 쓴 날은 ${peak.name}일 ${formatAmount(peak.value)}${unit}`
      }
    >
      {/* 세로축 라벨이 차지할 자리를 padding 으로 비워 둔다. "200,000원" 이 들어갈 폭이다 */}
      <div className="relative pl-20" style={{ height }}>
        {/* ── 세로축 눈금 (HTML) ───────────────────────────── */}
        {TICK_RATIOS.map((ratio) => (
          <span
            key={ratio}
            className="absolute left-0 w-[4.5rem] -translate-y-1/2 text-right text-caption text-muted-foreground tabular-nums"
            style={{ top: `${(1 - ratio) * 100}%` }}
          >
            {formatAmount(max * ratio)}
            {unit}
          </span>
        ))}

        {/* ── 격자선·영역·선 (SVG) ──────────────────────────
            viewBox 는 100x100 고정이고 실제 크기는 CSS 가 정한다.
            늘어나도 괜찮은 요소만 여기 둔다. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="size-full overflow-visible"
          aria-hidden
        >
          {TICK_RATIOS.map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2="100"
              y1={(1 - ratio) * 100}
              y2={(1 - ratio) * 100}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray={ratio === 0 ? undefined : "3 3"}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <polygon points={area} fill="var(--color-primary)" opacity={0.1} />
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* ── 최고점 표시 (HTML) ────────────────────────────
            SVG 안에 두면 preserveAspectRatio="none" 때문에 원이 타원이 된다. */}
        {peak.value > 0 ? (
          <div
            className="pointer-events-none absolute"
            style={{ left: `calc(5rem + ${peakPos.x}% - ${peakPos.x}% * 5 / 100)`, top: `${peakPos.y}%` }}
          >
            <span className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card" />
            {/*
              금액을 다시 적지 않는다. 최고점은 항상 세로축 최댓값과 같은 값이라
              두 번 쓰면 정보가 늘지 않고 글자만 늘어난다. 궁금한 건 "며칠이냐" 다.
            */}
            {/*
              ⚠️ 떠 있는 라벨에는 배경이 필요하다. 최고점 바로 옆은 선이 가장 가파르게
                 지나가는 자리라, 배경 없이 두면 글자와 선이 겹쳐 둘 다 읽히지 않는다.
            */}
            <span
              className={`absolute whitespace-nowrap rounded bg-card px-1 py-0.5 text-caption font-medium text-primary tabular-nums ${
                peakBelow ? "translate-y-2.5" : "-translate-y-[1.6rem]"
              } ${peakAnchor === "right" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"}`}
            >
              {peak.name}일 최고
            </span>
          </div>
        ) : null}
      </div>

      {/* ── 가로축 라벨 (HTML) ─────────────────────────────
          모든 날짜를 적으면 겹친다. 처음·중간·마지막 셋만 둔다. */}
      <div className="flex justify-between pl-20 text-caption text-muted-foreground tabular-nums">
        <span>{data[0].name}일</span>
        {data.length > 2 ? <span>{data[Math.floor((data.length - 1) / 2)].name}일</span> : null}
        {data.length > 1 ? <span>{data[data.length - 1].name}일</span> : null}
      </div>
    </figure>
  );
}
