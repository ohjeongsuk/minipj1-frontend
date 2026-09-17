"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { DailyBar } from "./DailyBar";
import { TrendLine } from "./TrendLine";
import type { ChartDatum } from "./types";

/**
 * 일별 지출 추이 카드. 그래프 종류를 고를 수 있다.
 *
 * 셋은 각자 다른 질문에 답한다 —
 *   선   : 언제 많이 썼나 (흐름)
 *   막대 : 하루하루 얼마 (비교)
 *   누적 : 이 속도면 얼마 (예측)
 * 같은 질문에 답하는 그래프는 넣지 않는다. 옆 칸에 이미 달력 히트맵이 있어
 * "언제 많이 썼나" 를 세 번 보여주게 된다.
 *
 * ⚠️ 선택은 localStorage 에 둔다. 월 이동(?ym=)은 "무엇을 보는가" 라 URL 이지만
 *    그래프 종류는 "어떻게 보는가" 라 개인 취향에 가깝다. 링크로 공유할 값이 아니다.
 *
 * ⚠️ 첫 렌더에서 localStorage 를 읽지 않는다. 서버는 읽을 수 없어 hydration 이 어긋난다.
 *    대시보드는 응답이 오기 전까지 스켈레톤을 보여주므로, 차트가 처음 그려지는 시점에는
 *    아래 useEffect 가 이미 돌아 있다. ThemeToggle 과 달리 mounted 가드가 필요 없는 이유다.
 */
const KEY = "moneylog_chart";

type ChartType = "line" | "bar" | "cumulative";

const TYPES = [
  { value: "line", label: "선" },
  { value: "bar", label: "막대" },
  { value: "cumulative", label: "누적" },
] as const;

function read(): ChartType {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === "bar" || stored === "cumulative" ? stored : "line";
  } catch {
    // 사생활 보호 모드에서는 읽기가 막힌다. 기본값으로 돌아가면 그만이다
    return "line";
  }
}

interface DailyTrendChartProps {
  /** 일별 지출. name 은 일자, value 는 그날 지출액 */
  data: ChartDatum[];
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
  const [type, setType] = useState<ChartType>("line");

  useEffect(() => setType(read()), []);

  function select(next: ChartType) {
    setType(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // 저장이 막혀도 이번 세션 동안은 적용된다
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-caption text-muted-foreground">일별 지출 추이</h2>

        {/* 헤더 네비게이션과 같은 세그먼트 컨트롤이다. 회색 트랙 위에 선택된 항목만 흰 pill.
            ⚠️ 그림자를 쓰지 않는다. 트랙과 pill 의 배경 차이 + 1px border 로 충분하다 */}
        <div
          role="group"
          aria-label="그래프 종류"
          className="flex items-center gap-1 rounded-lg bg-muted p-0.5"
        >
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => select(value)}
              aria-pressed={type === value}
              className={cn(
                "rounded-md px-2 py-0.5 text-caption transition-colors",
                type === value
                  ? "border border-border bg-card font-semibold text-foreground"
                  : "border border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {type === "bar" ? (
        <DailyBar data={data} label="일별 지출" />
      ) : type === "cumulative" ? (
        <TrendLine data={toCumulative(data)} label="누적 지출" showPeak={false} />
      ) : (
        <TrendLine data={data} label="일별 지출 추이" />
      )}
    </>
  );
}

/**
 * 누적합.
 *
 * ⚠️ 마지막 값은 "오늘까지 쓴 돈" 이지 "이번 달 총액" 이 아니다.
 *    들어오는 data 가 이미 asOf 까지로 잘려 있기 때문이다(대시보드에서 자른다).
 *    미래 날짜로 입력된 거래가 있으면 위쪽 요약 카드의 지출과 값이 다르다.
 *    아직 오지 않은 날을 그리면 선이 바닥에 붙어 "지출이 끊겼다" 로 읽히므로
 *    자르는 쪽이 맞고, 대신 두 숫자가 다를 수 있다는 것을 알고 있어야 한다.
 *
 * 새 차트 컴포넌트가 필요 없다는 것이 이 그래프를 고른 이유의 절반이다 —
 * TrendLine 이 ChartDatum[] 만 받으므로 데이터만 바꿔 넘기면 그대로 그린다.
 */
function toCumulative(data: ChartDatum[]): ChartDatum[] {
  let sum = 0;
  return data.map((datum) => ({ ...datum, value: (sum += datum.value) }));
}
