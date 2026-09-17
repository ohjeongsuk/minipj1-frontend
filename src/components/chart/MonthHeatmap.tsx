"use client";

import Link from "next/link";

import { formatAmount, formatAmountShort } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * 일별 수입·지출 캘린더.
 *
 * CSS grid-cols-7 + 배경색 단계로 그린다. Recharts 에 애초에 이런 차트가 없다.
 *
 * ⚠️ 칸마다 금액 두 줄이 들어가므로 aspect-square 를 쓰지 않는다.
 *    모바일 폭이 38px 이라 정사각형으로 두면 글자가 들어갈 자리가 없다.
 *    가로는 요일 7칸에 묶여 있으니 세로로만 늘린다.
 *
 * ⚠️ 확대(간격·여백·글자)를 sm 이 아니라 lg 에서 켠다. 대시보드가 sm 에서
 *    카드를 2열로 나누므로, sm 이 되는 순간 이 카드는 오히려 좁아진다
 *    (390px 전체 폭 → 640px 에서 반쪽 290px). sm 에 걸어 두면 390px 에서
 *    멀쩡하던 칸이 640px 에서 잘린다.
 *
 * ⚠️ 좁은 화면에서는 칸 안쪽 여백을 0 으로 둔다. 320px 에서 칸 하나가
 *    33px 뿐이라 2px 씩만 줘도 "10.7만"(30px) 이 들어가지 못한다.
 *    글자가 테두리에 닿지만, 칸이 이 정도로 작으면 여백보다 값이 먼저다.
 *
 * ⚠️ 좁은 화면에서는 칸 간격도 줄인다. 데스크톱 값 그대로 두면
 *    안쪽이 25px 뿐이라 "10.7만"(30px) 이 잘린다. 요일 머리글의 간격도
 *    함께 줄여야 열이 어긋나지 않는다.
 *
 * ⚠️ 0 원 글자에 투명도를 주지 않는다. muted-foreground/60 으로 흐리게 두면
 *    다크 모드에서 대비가 3.45:1 까지 떨어진다. 사용자가 보여 달라고 한 값이라
 *    장식이 아니다. 색(초록·빨강 vs 회색)만으로도 0 과 구분된다.
 *
 * ⚠️ 라우트를 여기서 정하지 않는다. hrefFor 로 받는다.
 *    차트는 화면이 어떤 주소 체계를 쓰는지 몰라야 한다 (CLAUDE.md 3장).
 */
export interface HeatmapDatum {
  /** yyyy-MM-dd */
  date: string;
  income: number;
  expense: number;
}

interface MonthHeatmapProps {
  data: HeatmapDatum[];
  /** 그 날짜를 눌렀을 때 갈 주소 */
  hrefFor: (date: string) => string;
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

/** 금액 줄은 일자보다 한 단계 작다. 일곱 칸에 묶여 있어 폭을 늘릴 수 없다 */
const AMOUNT = "truncate text-[0.625rem] lg:text-[0.6875rem]";

/**
 * 글자가 읽히는 범위까지만 칠한다.
 *
 * ⚠️ 예전 최대값은 1 이었다. 칸에 글자가 없던 시절에는 그래도 됐지만, 지금은
 *    같은 칸에 빨간 지출 금액이 얹힌다. 빨강 위의 빨강은 대비가 2.5:1 까지
 *    떨어져 둘 다 안 읽힌다. 0.15 로 낮추면 3.1:1 로, 이 앱이 원래 쓰는
 *    흰 배경 위 빨강(3.8:1)에 가까워진다.
 *    농도는 "어느 날이 무거웠나" 를 훑는 용도로만 남기고, 크기는 숫자가 말한다.
 */
const LEVEL_OPACITY = [0, 0.04, 0.07, 0.11, 0.15];

/**
 * 0 원도 그대로 보여준다. 빈칸으로 두면 "기록이 없다" 와 "0 원" 이 구분되지 않는다.
 *
 * ⚠️ 0 이 아닐 때는 "원" 을 떼는데, 칸이 그만큼 좁기 때문이다.
 *    데스크톱 칸 안쪽이 49px 인데 "10.7만원" 은 58px 라 잘린다("10.7만" 은 45px).
 *    카드 제목이 이미 금액이라고 말하고 있고, 정확한 값은 title·aria 가 원 단위로 준다.
 *    0 에만 "원" 을 남기는 이유는 숫자 하나만 떠 있으면 금액으로 안 읽히기 때문이다.
 */
function short(value: number): string {
  return value === 0 ? "0원" : formatAmountShort(value);
}

export function MonthHeatmap({ data, hrefFor }: MonthHeatmapProps) {
  if (data.length === 0) {
    return null;
  }

  const max = Math.max(...data.map((d) => d.expense), 1);
  // 1일이 무슨 요일인지에 따라 앞을 비운다
  const firstWeekday = new Date(`${data[0].date}T00:00:00`).getDay();

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-0.5 text-center text-caption text-muted-foreground lg:gap-1">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 lg:gap-1">
        {Array.from({ length: firstWeekday }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden />
        ))}
        {data.map((datum) => {
          const opacity = LEVEL_OPACITY[level(datum.expense / max)];
          const day = Number(datum.date.slice(-2));
          const month = Number(datum.date.slice(5, 7));
          return (
            <Link
              key={datum.date}
              href={hrefFor(datum.date)}
              /*
               * 축약한 금액(1.2만)만으로는 정확한 값을 알 수 없다.
               * 스크린리더와 마우스 양쪽에 원래 금액을 준다.
               */
              aria-label={`${month}월 ${day}일 내역 보기. 수입 ${formatAmount(datum.income)}원, 지출 ${formatAmount(datum.expense)}원`}
              title={`${datum.date}\n수입 ${formatAmount(datum.income)}원\n지출 ${formatAmount(datum.expense)}원`}
              className={cn(
                "flex min-h-[4.5rem] flex-col gap-0.5 rounded-md border border-border px-0 py-1 lg:px-1",
                "leading-tight tabular-nums",
                "transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
              style={{
                backgroundColor:
                  opacity > 0 ? `color-mix(in srgb, var(--color-expense) ${opacity * 100}%, transparent)` : undefined,
              }}
            >
              <span className="text-[0.625rem] text-muted-foreground lg:text-caption">{day}</span>
              {/* 앱의 다른 화면과 같은 순서로 둔다 — 총수입 다음 총지출 */}
              <span className={cn(AMOUNT, datum.income > 0 ? "text-income" : "text-muted-foreground")}>
                {short(datum.income)}
              </span>
              <span className={cn(AMOUNT, datum.expense > 0 ? "text-expense" : "text-muted-foreground")}>
                {short(datum.expense)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
