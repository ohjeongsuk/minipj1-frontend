"use client";

import { TrendingUp } from "lucide-react";

import { formatAmount } from "@/lib/money";
import type { Forecast } from "@/types/api";

/**
 * 이번 달 예상 지출 (STAT-04, STAT-07).
 *
 * ⚠️ 프론트에서 예측을 다시 계산하지 않는다.
 *    수식(확정 + 일평균 × 남은 일수)의 정본은 백엔드이며,
 *    화면이 같은 계산을 다시 하면 두 곳이 갈라진다. 서버 값을 그대로 표시한다.
 *
 * 과거 달을 보고 있으면 이 카드를 아예 렌더링하지 않는다.
 * 이미 끝난 달의 "예상"은 의미가 없다.
 */
interface ForecastCardProps {
  forecast: Forecast | null;
  isPastMonth: boolean;
}

export function ForecastCard({ forecast, isPastMonth }: ForecastCardProps) {
  if (isPastMonth) {
    return null;
  }

  // 직전 3개월에 거래가 한 건도 없으면 서버가 null 을 준다
  if (!forecast) {
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-border p-5">
        <span className="text-caption text-muted-foreground">이번 달 예상 지출</span>
        <p className="text-item font-semibold">예측하려면 데이터가 조금 더 필요해요</p>
        <p className="text-caption text-muted-foreground">
          최근 3개월에 기록이 쌓이면 이 자리에 예상 지출을 보여드려요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-5">
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <TrendingUp className="size-4" aria-hidden />
        이번 달 예상 지출
      </span>
      <p className="text-item">
        이번 달 이 속도면{" "}
        <strong className="text-2xl font-semibold tabular-nums text-expense">
          {formatAmount(forecast.projectedExpense)}원
        </strong>
        을 쓰게 돼요
      </p>
      <p className="text-caption text-muted-foreground tabular-nums">
        {forecast.daysElapsed}일 경과 · 최근 {forecast.basisMonths}개월 기준 · 일평균{" "}
        {formatAmount(forecast.baselineDailyAvg)}원
      </p>
    </div>
  );
}
