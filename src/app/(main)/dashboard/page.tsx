"use client";

import { CalendarOff } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { BudgetBar } from "@/components/chart/BudgetBar";
import { CategoryDonut } from "@/components/chart/CategoryDonut";
import { MonthHeatmap } from "@/components/chart/MonthHeatmap";
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
import { cn, SECTION_CARD } from "@/lib/utils";

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
      <div className="flex flex-col gap-6">
        {header}
        <CardSkeleton cards={3} />
      </div>
    );
  }

  if (stats.error || !stats.data) {
    const apiError = stats.error instanceof ApiRequestError ? stats.error.error : null;
    return (
      <div className="flex flex-col gap-6">
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

  /*
   * 히트맵은 수입·지출을 모두 보여주고, 각 날짜가 그날의 내역으로 가는 링크가 된다.
   *
   * ⚠️ 아직 오지 않은 날을 잘라내지 않는다. 서버는 그 달 전체(30·31일)를 내려주는데,
   *    달력 모양에서는 빈 칸이 "기록 없음" 으로 자연스럽게 읽히고,
   *    날짜 칸을 빼면 요일 정렬이 통째로 어긋난다.
   */
  const heatmapData = daily.map((d) => ({ date: d.date, income: d.income, expense: d.expense }));
  // 내역 페이지는 from·to 를 URL 에서 그대로 읽는다. 하루만 보려면 둘을 같게 준다
  const dayHref = (date: string) => `/transactions?from=${date}&to=${date}`;

  /*
   * ⚠️ 카드를 2열로 나누는 시점이 lg 다. sm(640px) 에서 나누면 카드 하나가
   *    290px 가 되는데, 이는 390px 단일 열(343px)보다 좁다. 화면이 넓어졌는데
   *    카드는 좁아지는 구간이 생기고, 7열 캘린더처럼 폭을 먹는 카드가 거기서
   *    잘린다. lg(1024px) 부터는 반쪽도 482px 라 실제로 넓어진다.
   */
  return (
    <div className="flex flex-col gap-6">
      {header}

      <SummaryCards summary={summary} />

      {/*
        일별 수입·지출 달력. 요약 바로 다음 자리다.

        ⚠️ grid 밖이라 lg:col-span-2 가 필요 없다. 부모가 flex flex-col 이라
           그냥 전체 폭을 쓴다. 달력 칸이 넓어지는 lg 확대는 MonthHeatmap 안에 있다.

        ⚠️ 기록이 없는 달에는 그리지 않는다. 아래 EmptyState 가 그 자리를 대신하는데,
           빈 달력과 "기록이 없어요" 를 함께 띄우면 같은 말을 두 번 하게 된다.
      */}
      {isEmptyMonth ? null : (
        /*
         * ⚠️ 이 카드만 모바일에서 안쪽 여백을 줄인다(p-5 → p-3).
         *    7 열 달력이라 칸 폭이 카드 여백에 그대로 깎이는데, 390px 에서
         *    좌우 20px 씩 40px 를 돌려받으면 칸이 41.3px → 47px 가 된다.
         *    그 5.7px 가 금액 글자 한 단계를 좌우한다.
         *
         *    다른 카드는 SECTION_CARD 그대로 둔다. 여백이 좁아서 득을 보는 것은
         *    폭을 7 로 나눠 쓰는 이 카드뿐이고, 공통 상수를 건드리면 전부 따라온다.
         */
        <section className={cn(SECTION_CARD, "p-3 sm:p-5")}>
          <h2 className="text-caption text-muted-foreground">일별 수입·지출</h2>
          <MonthHeatmap data={heatmapData} hrefFor={dayHref} />
        </section>
      )}

      {!isPastMonth || anomalies.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
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
        <div className="grid gap-3 lg:grid-cols-2">
          <section className={SECTION_CARD}>
            <h2 className="text-caption text-muted-foreground">카테고리별 지출</h2>
            <CategoryDonut data={donutData} total={summary.expense} percents={percents} />
          </section>

          <section className={SECTION_CARD}>
            <h2 className="text-caption text-muted-foreground">예산 소진율</h2>
            {budgetData.length === 0 ? (
              <p className="text-caption text-muted-foreground">
                아직 설정한 예산이 없어요.
              </p>
            ) : (
              <BudgetBar data={budgetData} showRatio />
            )}
          </section>
        </div>
      )}

      <RecurringCard data={recurring.data} isPending={recurring.isPending} />
    </div>
  );
}
