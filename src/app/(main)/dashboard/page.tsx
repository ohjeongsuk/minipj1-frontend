"use client";

import { CalendarOff } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { BudgetBar } from "@/components/chart/BudgetBar";
import { CategoryDonut } from "@/components/chart/CategoryDonut";
import { MonthHeatmap } from "@/components/chart/MonthHeatmap";
import { TrendLine } from "@/components/chart/TrendLine";
import type { ChartDatum } from "@/components/chart/types";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton } from "@/components/common/ListSkeleton";
import { AnomalyCard } from "@/components/dashboard/AnomalyCard";
import { ForecastCard } from "@/components/dashboard/ForecastCard";
import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { RecurringCard } from "@/components/dashboard/RecurringCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { useMonthlyStats, useRecurring } from "@/hooks/useStats";
import { ApiRequestError } from "@/lib/apiClient";
import { currentMonth, today } from "@/lib/date";
import { resolveError } from "@/lib/errorMessages";
import { distributePercent } from "@/lib/percent";

/**
 * ⚠️ useSearchParams 를 쓰므로 <Suspense> 로 감싼다.
 *    감싸지 않으면 개발 서버에서는 통과하다가 npm run build 에서 실패한다.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<CardSkeleton cards={3} />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /*
   * asOf 를 마운트 시 한 번만 고정한다.
   * 렌더마다 today() 를 부르면 자정을 넘기는 순간 쿼리 키가 바뀌어 재요청이 난다.
   * toISOString() 은 쓰지 않는다 — UTC 로 변환되어 날짜가 하루 어긋난다.
   */
  const [asOf] = useState(today);
  const yearMonth = searchParams.get("ym") || currentMonth();

  const stats = useMonthlyStats(yearMonth, asOf);
  const recurring = useRecurring(asOf);

  // yyyy-MM 은 문자열 정렬이 곧 시간 정렬이다
  const isPastMonth = yearMonth < currentMonth();

  function changeMonth(next: string) {
    router.push(next === currentMonth() ? pathname : `${pathname}?ym=${next}`);
  }

  const header = <MonthPicker yearMonth={yearMonth} onChange={changeMonth} />;

  if (stats.isPending) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <CardSkeleton cards={3} />
      </div>
    );
  }

  if (stats.error || !stats.data) {
    const apiError = stats.error instanceof ApiRequestError ? stats.error.error : null;
    return (
      <div className="flex flex-col gap-4">
        {header}
        <ErrorState
          message={resolveError(apiError).message}
          onRetry={() => void stats.refetch()}
          retrying={stats.isFetching}
        />
      </div>
    );
  }

  const { summary, byCategory, daily, forecast, anomalies, budgets } = stats.data;
  // 거래가 없는 달은 에러가 아니라 모두 0 인 정상 상태다 (STAT-08)
  const isEmptyMonth = summary.income === 0 && summary.expense === 0;

  // 표시용 정수 퍼센트. 각각 반올림하면 합이 99% 나 101% 로 보인다
  const percents = distributePercent(byCategory.map((c) => c.ratio));

  const donutData: ChartDatum[] = byCategory.map((c) => ({
    name: c.deleted ? `${c.name} (삭제됨)` : c.name,
    value: c.amount,
    color: c.color,
  }));

  // 예산 응답에는 색이 없으므로 같은 달의 카테고리 집계에서 찾아 쓴다
  const colorByCategoryId = new Map(byCategory.map((c) => [c.categoryId, c.color]));
  const budgetData: ChartDatum[] = budgets.map((b) => ({
    name: b.name,
    value: b.spent,
    color: colorByCategoryId.get(b.categoryId),
    max: b.budget, // 항목마다 상한이 다르다
  }));

  const heatmapData = daily.map((d) => ({ date: d.date, value: d.expense }));
  const trendData: ChartDatum[] = daily.map((d) => ({
    name: String(Number(d.date.slice(-2))),
    value: d.expense,
  }));

  return (
    <div className="flex flex-col gap-4">
      {header}

      <SummaryCards summary={summary} />

      {!isPastMonth || anomalies.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ForecastCard forecast={forecast} isPastMonth={isPastMonth} />
          <AnomalyCard anomalies={anomalies} />
        </div>
      ) : null}

      {isEmptyMonth ? (
        <EmptyState
          icon={CalendarOff}
          title="이 달에는 기록이 없어요"
          description="위의 화살표로 다른 달을 볼 수 있어요."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-caption text-muted-foreground">카테고리별 지출</h2>
            <CategoryDonut data={donutData} total={summary.expense} percents={percents} />
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-caption text-muted-foreground">예산 소진율</h2>
            {budgetData.length === 0 ? (
              <p className="text-caption text-muted-foreground">
                아직 설정한 예산이 없어요.
              </p>
            ) : (
              <BudgetBar data={budgetData} showRatio />
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-caption text-muted-foreground">일별 지출</h2>
            <MonthHeatmap data={heatmapData} />
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-caption text-muted-foreground">일별 지출 추이</h2>
            <TrendLine data={trendData} label="일별 지출 추이" />
          </section>
        </div>
      )}

      <RecurringCard data={recurring.data} isPending={recurring.isPending} />
    </div>
  );
}
