"use client";

import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { formatAmount, formatAmountShort } from "@/lib/money";
import type { StatsSummary } from "@/types/api";

/**
 * 이번 달 요약 (STAT-01).
 *
 * 세 값을 한 줄에 늘어놓되 같은 무게로 두지 않는다. 잔액이 칸을 두 배로 쓰고
 * 글자도 한 단계 크다(2:1:1). 균등한 세 칸은 눈이 어디에 멈출지 정해주지 않아
 * 위계가 사라지고, 수입·지출은 잔액을 만든 근거이지 같은 급의 값이 아니다.
 *
 * 수입 초록 · 지출 빨강은 단일 액센트 규칙의 예외다.
 * 금액의 방향을 색으로 구분하는 것이 이 앱의 핵심 정보이기 때문이다.
 *
 * ⚠️ 잔액에 font-bold 를 쓰지 않는다. 크기와 색이 이미 강조이고,
 *    거기에 굵기까지 더하면 tabular-nums 의 자릿수 정렬이 뭉갠다.
 *
 * ⚠️ shadow-hero 는 "그림자 대신 1px border" 규칙의 의도된 예외다.
 *    이 화면에서 가장 중요한 숫자 하나를 배경에서 띄우기 위해 이 카드에만 쓴다.
 *    다른 카드로 번지면 예외가 규칙이 되고, 그 순간 면 구분이 border 와 그림자
 *    두 체계로 갈라진다. 값은 globals.css 의 --hero-shadow 한 곳에만 둔다.
 *    다크 모드에서는 그 토큰이 none 이 되어 border 만 남는다.
 *
 * ⚠️ 모바일에서는 세 값 모두 만 단위로 줄인다. sm 부터 셋 다 원 단위로 돌아간다.
 *    수입·지출은 자리가 없어서다 — 390px 에서 칸 안쪽이 73.3px 인데
 *    "3,200,000원" 은 76.7px 라 넘친다. "320만원" 은 54px 다.
 *    잔액은 자리가 있는데도 줄인다. 한 줄에 놓인 세 값의 단위가 갈리면
 *    "2,171,699" 과 "320만" 이 나란히 서서 어느 쪽이 큰지 한눈에 안 들어오기 때문이다.
 *    ⚠️ 셋을 따로 정하지 않는다. 한쪽만 바꾸면 그 순간 단위가 다시 갈린다.
 *    정확한 값은 세 dd 모두 title 로 원 단위를 준다.
 *
 * ⚠️ 칸마다 min-w-0 이 필요하다. grid 항목의 기본값이 min-width:auto 라
 *    "글자가 안 잘리는 폭" 아래로 줄어들지 않고, 그래서 칸이 부풀어 카드를
 *    뚫는다. dd 에 건 truncate 는 칸 안에서 줄이는 장치라 이때는 발동하지 않는다.
 *
 * 액션 바를 별도 컴포넌트로 빼지 않는다. 카드 하단에 맞물려 한 덩어리로 보이는 것이
 * 이 UI 의 요점이라, 떼어놓으면 화면이 둘의 결합 방식을 알아야 한다.
 */
/*
 * ⚠️ 둘의 무게가 다르다. 예전에는 둘 다 액센트로 채워 위계가 없었는데,
 *    이 앱의 1 순위 행동은 기록이다("3초 안에 기록"). 예산 설정은 한 달에
 *    한 번 하는 일이라 같은 무게로 두면 매번 어느 쪽을 누를지 고르게 만든다.
 */
const ACTIONS = [
  { href: "/transactions", label: "내역 추가", icon: Plus, primary: true },
  { href: "/budgets", label: "예산 설정", icon: Wallet, primary: false },
] as const;

export function SummaryCards({ summary }: { summary: StatsSummary }) {
  return (
    // overflow-hidden 이 액션 바의 아래쪽 모서리를 카드 라운드에 맞춰 잘라낸다
    <section className="overflow-hidden rounded-xl border border-border shadow-hero">
      {/*
        칸 비율을 고정한다. flex-[2] 로도 되지만 grid 여야 세로 구분선(divide-x)이
        칸 경계에 정확히 선다.
        ⚠️ 2:1:1 이라 잔액 칸이 정확히 절반이다. 아래 액션 바가 5:5 이므로
           위아래 구분선이 같은 자리에 선다. 비율을 바꾸면 선이 어긋난다.
           좁은 화면에서는 잔액 칸의 여백을 줄여 자리를 만든다.
           ⚠️ 320px 의 px-2(8px) 는 잔액이 "2,171,699원"(125px) 이던 시절에
              칸(144px)을 넘기지 않으려고 잡은 값이다. 지금은 모바일에서
              "217만원" 으로 줄어 여유가 생겼지만, 여백을 도로 늘리지는 않는다 —
              넓히면 좌우 칸이 그만큼 좁아지고 거기가 더 빠듯하다.
      */}
      <dl className="grid grid-cols-[2fr_1fr_1fr] divide-x divide-border bg-card">
        <div className="flex min-w-0 flex-col justify-center gap-0.5 px-2 py-4 xs:px-4 sm:px-5">
          <dt className="truncate text-xs text-muted-foreground sm:text-sm">이번 달 잔액</dt>
          <dd
            title={`${formatAmount(summary.net)}원`}
            className={cn(
              "flex items-baseline gap-0.5 truncate text-2xl sm:gap-1 font-medium tracking-tight tabular-nums sm:text-3xl",
              summary.net < 0 ? "text-expense" : "text-foreground",
            )}
          >
            {/*
              ⚠️ 모바일에서는 잔액도 만 단위로 줄인다. 폭이 모자라서가 아니라
                 한 줄에 놓인 세 값의 단위를 맞추기 위해서다. 잔액만 원 단위면
                 "2,171,699" 과 "320만" 이 나란히 서서 어느 쪽이 큰지 한눈에 안 들어온다.
                 정확한 값은 이 dd 의 title 이 원 단위로 준다.
            */}
            {/*
              ⚠️ 모바일은 "원" 을 큰 글자 안에 그대로 둔다. 축약하면 단위가
                 "만원" 한 덩어리가 되는데, "만" 만 24px 이고 "원" 만 13px 이면
                 한 단어가 두 크기로 쪼개져 잘못 그려진 것처럼 보인다.
                 수입·지출도 모바일에서는 "320만원" 을 통으로 쓰므로 이쪽이 일관된다.

              ⚠️ 데스크톱은 반대다. 숫자가 "2,171,699" 로 끝나므로 "원" 은
                 단위 표시일 뿐이고, 작고 흐리게 두어야 숫자가 먼저 읽힌다.
            */}
            <span className="sm:hidden">{formatAmountShort(summary.net)}원</span>
            <span className="hidden sm:inline">{formatAmount(summary.net)}</span>
            <span className="hidden text-caption font-normal text-muted-foreground sm:inline">원</span>
          </dd>
        </div>

        {/* 수입·지출은 잔액보다 한 단계 작다. 근거이지 결론이 아니다 */}
        <div className="flex min-w-0 flex-col justify-center gap-0.5 px-1.5 py-4 sm:px-4">
          <dt className="truncate text-xs text-muted-foreground sm:text-sm">총수입</dt>
          <dd
            /* 축약값이 잘릴 만큼 큰 금액일 때 원래 값을 확인할 수 있게 둔다 */
            title={`${formatAmount(summary.income)}원`}
            className="truncate text-caption font-semibold text-income tabular-nums sm:text-item"
          >
            <span className="sm:hidden">{formatAmountShort(summary.income)}원</span>
            <span className="hidden sm:inline">{formatAmount(summary.income)}원</span>
          </dd>
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-0.5 px-1.5 py-4 sm:px-4">
          <dt className="truncate text-xs text-muted-foreground sm:text-sm">총지출</dt>
          <dd
            /* 축약값이 잘릴 만큼 큰 금액일 때 원래 값을 확인할 수 있게 둔다 */
            title={`${formatAmount(summary.expense)}원`}
            className="truncate text-caption font-semibold text-expense tabular-nums sm:text-item"
          >
            <span className="sm:hidden">{formatAmountShort(summary.expense)}원</span>
            <span className="hidden sm:inline">{formatAmount(summary.expense)}원</span>
          </dd>
        </div>
      </dl>

      {/* 5:5 다. 위 칸이 2:1:1 이라 잔액 칸 경계와 이 구분선이 같은 자리에 선다 */}
      {/*
        divide-x 를 쓰지 않는다. 두 칸의 배경이 달라져서 경계가 색으로 이미 드러나고,
        divide 는 한 가지 색만 줄 수 있어 액센트 쪽에서 너무 세거나 카드 쪽에서
        안 보이거나 둘 중 하나가 된다. 카드 쪽에만 border-l 을 준다.
      */}
      <div className="grid grid-cols-2 border-t border-border">
        {ACTIONS.map(({ href, label, icon: Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-center gap-2 py-3.5 text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
              primary
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-l border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
