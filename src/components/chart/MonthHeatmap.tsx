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
 * ⚠️ 확대(간격·여백·글자·높이)를 sm 이 아니라 lg 에서 켠다. 대시보드가 카드를
 *    2열로 나누는 시점이 lg 이고, 이 카드는 거기서 2열을 다 쓰도록 되어 있다.
 *    즉 lg 는 이 카드가 실제로 넓어지는 유일한 지점이다.
 *    sm 에 걸면 아직 좁은 폭에서 확대가 켜져 칸이 잘린다.
 *
 * ⚠️ 좁은 화면에서는 칸 안쪽 여백을 0 으로 둔다. 320px 에서 칸 하나가
 *    33px 뿐이라 2px 씩만 줘도 "10.7만"(30px) 이 들어가지 못한다.
 *    글자가 테두리에 닿지만, 칸이 이 정도로 작으면 여백보다 값이 먼저다.
 *
 * ⚠️ 좁은 화면에서는 칸 간격도 줄인다. 데스크톱 값 그대로 두면
 *    안쪽이 25px 뿐이라 "10.7만"(30px) 이 잘린다. 요일 머리글의 간격도
 *    함께 줄여야 열이 어긋나지 않는다.
 *
 * ⚠️ 금액에 투명도를 주지 않는다. muted-foreground/60 으로 흐리게 두면
 *    다크 모드에서 대비가 3.45:1 까지 떨어진다. 사용자가 보여 달라고 한 값이라
 *    장식이 아니다.
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

/**
 * 금액 줄.
 *
 * 칸 폭이 7열에 묶여 있어 화면 폭에 따라 세 단계로 나눈다.
 * 기준은 부호까지 붙인 최악값("-10.7만원" 7자)이 칸 안쪽에 들어가는가다.
 *
 * | 화면     | 칸 폭  | 들어가는 최대 | 채택   |
 * |----------|-------|-------------|--------|
 * | 320px    | 33.6px| 7.5px       | 7px    |
 * | xs(360~) | 39.3px| 8.5px       | 8px    |
 * | sm(640~) | 74.7px| 16px 이상    | 15px   |
 *
 * ⚠️ xs 한 칸이 360~639px 를 다 덮으므로 그 구간의 천장은 가장 좁은 360px 이 정한다.
 *    390px 이면 칸이 43.6px 라 9.5px 까지 들어가지만 8px 를 쓴다. 그 사이에
 *    breakpoint 를 하나 더 만들면 1~2px 을 더 얻지만, 토큰이 하나 늘어난다.
 *
 * ⚠️ 한계값을 그대로 쓰지 않고 한 단계 낮춰 잡는다. 폰트 로딩 전 대체 글꼴이
 *    Pretendard 보다 넓으면 한계값에서는 첫 페인트에 바로 잘린다.
 *
 * ⚠️ 폭 계산은 캔버스로 하면 틀린다. 칸에 tabular-nums 가 걸려 있어 숫자가
 *    고정폭이 되는데 canvas measureText 는 그걸 반영하지 못한다.
 *    실제로 캔버스가 "8px 에서 2.6px 여유" 라고 한 자리가 DOM 에서는 2px 잘렸다.
 *    크기를 바꿀 때는 브라우저에서 scrollWidth 로 재야 한다.
 *
 * ⚠️ 360px 경계는 xs breakpoint 다. Tailwind 기본값은 sm(640px)이 가장 작아
 *    "가장 좁은 폰" 과 "보통 폰" 을 나눌 수 없다. globals.css 가 이 칸을 만들어 둔 이유다.
 *
 * ⚠️ 15px 를 lg 가 아니라 sm 부터 켠다. 640px 이면 칸이 74.7px 라 이미 충분한데,
 *    lg 까지 미루면 640~1023px 구간만 이유 없이 작은 글자를 쓰게 된다.
 *
 * ⚠️ 색은 수입 초록·지출 빨강이 아니라 잉크색(text-foreground)이다.
 *    §8 은 "금액의 방향을 색으로 구분" 을 액센트 규칙의 예외로 두지만, 이 칸에서는
 *    그 두 색이 배경 농도 위에 얹혀 가장 안 읽히는 글자가 됐다 — 실측으로
 *    지출 빨강 3.0:1, 수입 초록 2.0:1 로 본문 기준(4.5:1)에 한참 못 미쳤다.
 *    잉크색은 같은 자리에서 14.9:1 이다. 방향은 색 대신 부호가 말한다(short 참조).
 *
 * ⚠️ 목록·요약 카드의 금액은 바꾸지 않는다. 그쪽은 배경이 흰 카드라 초록·빨강이
 *    제 대비를 내고, 색으로 훑는 것이 실제로 도움이 된다. 여기만 예외인 이유는
 *    칸마다 배경 농도가 다른 히트맵이기 때문이다.
 *
 * 그 결과 sm 이상에서 금액(15px)이 일자(13px)보다 커진다. 일자는 "몇 일인가" 를
 * 말하는 라벨이고 금액이 이 칸의 데이터이므로 위계가 뒤집힌 것이 아니다.
 */
/* ⚠️ 부호가 한 글자를 더 먹는다. 부호 없이 재면 각각 8px·9.5px 까지 들어가므로,
      표기를 바꿀 때는 위 표도 다시 재야 한다. 실제로 부호를 붙인 뒤 360px 에서
      "-10.7만원" 이 1px 잘렸다.

   rem 을 쓴다 — 사용자가 브라우저 기본 글꼴을 키웠을 때 함께 커져야 한다.
   0.4375rem = 7px, 0.5rem = 8px (기본 16px 기준) */
const AMOUNT =
  "truncate text-foreground text-[0.4375rem] xs:text-[0.5rem] sm:text-body";

/**
 * 글자가 읽히는 범위까지만 칠한다.
 *
 * ⚠️ 상한이 0.15 다. 예전 최대값은 1 이었는데, 칸에 글자가 없던 시절 이야기다.
 *    지금은 같은 칸에 금액이 얹히므로 농도를 올리면 글자가 먼저 죽는다.
 *    농도는 "어느 날이 무거웠나" 를 훑는 용도로만 남기고, 크기는 숫자가 말한다.
 *
 * ⚠️ 칠하는 색은 --color-heat(라벤더) 전용 토큰이다. 이 앱의 다른 색은 전부
 *    뜻을 갖고 있어 쓸 수 없다 — 빨강은 지출, 초록은 수입, 인디고는 "누를 수 있음".
 *    고른 이유는 globals.css 의 --color-heat 주석에 적었다.
 */
const LEVEL_OPACITY = [0, 0.04, 0.07, 0.11, 0.15];

/**
 * 0 원인 줄은 아예 그리지 않는다.
 *
 * 예전에는 "0원" 을 찍었다. 빈칸이 "기록이 없다" 와 "0 원" 두 뜻으로 읽힐까 봐서인데,
 * 이 앱에서는 그 둘이 같은 상태다 — CLAUDE.md 4장이 amount > 0 을 DB 제약과 DTO
 * 양쪽에 걸어 두어 금액 0 짜리 거래가 존재할 수 없다. 합계가 0 이면 그날 그 종류의
 * 거래가 없었다는 뜻뿐이고, 달력에서는 빈 자리가 그것을 이미 말한다.
 *
 * ⚠️ 화면에서만 지운다. 칸의 title 과 aria-label 은 수입·지출을 원 단위로 계속 적는다.
 *    스크린리더 사용자는 빈 자리를 "없음" 으로 읽을 방법이 없기 때문이다.
 *
 * "원" 은 화면 폭과 무관하게 항상 붙인다. 숫자만 떠 있으면 금액으로 안 읽히고,
 * 좁은 화면은 "원" 을 떼는 대신 AMOUNT 가 글자를 줄여 자리를 만든다.
 * 축약값의 정확한 금액은 칸의 title·aria-label 이 원 단위로 따로 준다.
 *
 * ⚠️ 부호를 붙인다. 금액 글자를 잉크색으로 통일하면서 수입·지출을 색으로 구분할 수
 *    없게 됐는데, 0 원 줄을 감춘 뒤로는 칸에 금액이 한 줄만 있는 경우가 대부분이라
 *    그 한 줄이 들어온 돈인지 나간 돈인지 알 방법이 사라진다. 부호가 그 자리를 대신한다.
 *    내역 화면의 formatSignedAmount 가 이미 쓰는 표기라 새 관례가 아니다.
 *    (그쪽은 원 단위 전체 표기라 함수를 공유하지 않고 축약본을 여기서 만든다)
 */
function short(value: number, type: "INCOME" | "EXPENSE"): string {
  return `${type === "INCOME" ? "+" : "-"}${formatAmountShort(value)}원`;
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
      <div className="grid grid-cols-7 gap-0.5 text-center text-caption font-medium text-grid-label lg:gap-1">
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
                /*
                 * 칸 높이는 화면마다 다르다.
                 *
                 * ⚠️ 모바일은 52px 다. 예전 72px 는 내용(일자 + 금액 두 줄)이 44.5px 밖에
                 *    안 쓰는데 27.5px 가 빈 채로 남아, 여섯 줄이 쌓이면 달력 하나가
                 *    432px 를 차지했다. 52px 면 312px 로 줄어 한 화면에 들어온다.
                 *    min-height 라 글자가 커져 내용이 더 필요해지면 칸이 알아서 늘어난다.
                 *
                 * ⚠️ lg 는 반대로 96px 로 키운다. 거기서는 칸이 135px 로 넓어지는데
                 *    높이를 그대로 두면 1.9:1 로 납작해져 달력이 아니라 표처럼 보인다.
                 */
                "flex min-h-[3.25rem] flex-col gap-0.5 rounded-md border border-grid px-0 py-1 lg:min-h-24 lg:px-1",
                "leading-tight tabular-nums",
                "transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
              style={{
                backgroundColor:
                  opacity > 0
                    ? `color-mix(in srgb, var(--color-heat) calc(${opacity * 100}% * var(--heat-scale)), transparent)`
                    : undefined,
              }}
            >
              {/*
                일자는 굵게 두되 색은 muted 로 남긴다.

                날짜는 이 칸의 이름이라 "14일을 찾는다" 는 훑기의 기준점이고,
                10px muted(#737373) 는 그러기에 너무 흐렸다. 굵기가 그걸 메운다.

                ⚠️ 색은 --grid-label 이다. 다크에서 muted(#a3a3a3)가 어둡게 느껴져
                   한 단계 밝힌 값(#c9c9c9)을 쓰되, 잉크색 금액보다는 여전히 흐리다.
                   일자까지 foreground 로 올리면 이 칸의 데이터인 금액과 구분되지 않는다.
                   특히 모바일은 일자(10px)가 금액(9px)보다 이미 크다.
              */}
              <span className="font-semibold text-[0.625rem] text-grid-label lg:text-caption">
                {day}
              </span>
              {/* 앱의 다른 화면과 같은 순서로 둔다 — 총수입 다음 총지출.
                  0 인 줄은 아예 그리지 않는다. 좁은 칸에서 "0원" 두 줄이 자리를
                  차지하면 정작 값이 있는 날이 눈에 띄지 않는다. */}
              {datum.income > 0 ? (
                <span className={AMOUNT}>{short(datum.income, "INCOME")}</span>
              ) : null}
              {datum.expense > 0 ? (
                <span className={AMOUNT}>{short(datum.expense, "EXPENSE")}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
