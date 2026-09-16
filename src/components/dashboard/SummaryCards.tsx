"use client";

import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { formatAmount } from "@/lib/money";
import type { StatsSummary } from "@/types/api";

/**
 * 이번 달 요약 (STAT-01).
 *
 * 세 값을 같은 크기로 늘어놓지 않고 잔액 하나를 히어로로 올린다.
 * 동급 카드 3개는 눈이 어디에 멈출지 정해주지 않아 위계가 없다.
 * 수입·지출은 잔액을 만든 근거이므로 아래 보조 줄로 내린다.
 *
 * 수입 초록 · 지출 빨강은 단일 액센트 규칙의 예외다.
 * 금액의 방향을 색으로 구분하는 것이 이 앱의 핵심 정보이기 때문이다.
 *
 * ⚠️ 히어로 숫자에 font-bold 를 쓰지 않는다. 40px 이 이미 충분한 강조라
 *    거기에 굵기까지 더하면 화면이 무거워지고 tabular-nums 의 자릿수 정렬도 뭉갠다.
 *
 * ⚠️ shadow-hero 는 "그림자 대신 1px border" 규칙의 의도된 예외다.
 *    이 화면에서 가장 중요한 숫자 하나를 배경에서 띄우기 위해 잔액 카드에만 쓴다.
 *    다른 카드로 번지면 예외가 규칙이 되고, 그 순간 면 구분이 border 와 그림자
 *    두 체계로 갈라진다. 값은 globals.css 의 --hero-shadow 한 곳에만 둔다.
 *    다크 모드에서는 그 토큰이 none 이 되어 border 만 남는다.
 *
 * 액션 바를 별도 컴포넌트로 빼지 않는다. 카드 하단에 맞물려 한 덩어리로 보이는 것이
 * 이 UI 의 요점이라, 떼어놓으면 화면이 둘의 결합 방식을 알아야 한다.
 */
const ACTIONS = [
  { href: "/transactions", label: "내역 추가", icon: Plus },
  { href: "/budgets", label: "예산 설정", icon: Wallet },
] as const;

export function SummaryCards({ summary }: { summary: StatsSummary }) {
  return (
    // overflow-hidden 이 액션 바의 아래쪽 모서리를 카드 라운드에 맞춰 잘라낸다
    <section className="overflow-hidden rounded-xl border border-border shadow-hero">
      <div className="flex flex-col items-center gap-2 bg-card px-4 py-8">
        <span className="text-caption text-muted-foreground">이번 달 잔액</span>

        <p
          className={cn(
            "flex items-baseline gap-1.5 text-4xl font-medium tracking-tight tabular-nums sm:text-5xl",
            summary.net < 0 ? "text-expense" : "text-foreground",
          )}
        >
          {formatAmount(summary.net)}
          <span className="text-body font-normal text-muted-foreground">원</span>
        </p>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-border border-t border-border bg-card">
        <div className="flex flex-col items-center gap-1 py-4">
          <dt className="text-caption text-muted-foreground">총수입</dt>
          <dd className="text-item font-semibold text-income tabular-nums">
            {formatAmount(summary.income)}원
          </dd>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <dt className="text-caption text-muted-foreground">총지출</dt>
          <dd className="text-item font-semibold text-expense tabular-nums">
            {formatAmount(summary.expense)}원
          </dd>
        </div>
      </dl>

      {/* 구분선은 액센트 위에 얹히므로 border-border 가 아니라 전경색을 흐린 값을 쓴다 */}
      <div className="grid grid-cols-2 divide-x divide-primary-foreground/25">
        {ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-2 bg-primary py-3.5 text-body font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
