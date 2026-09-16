"use client";

import { useQuery } from "@tanstack/react-query";

import { request } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { MonthlyStatsResponse, RecurringResponse } from "@/types/api";

/**
 * 월 대시보드 집계.
 *
 * 요약·카테고리별·일별·런레이트·이상치·예산을 엔드포인트 하나로 받는다.
 * 다섯 개로 쪼개면 같은 테이블을 다섯 번 스캔하고, 각각 따로 만료되어
 * 화면 안에서 숫자가 서로 어긋나는 순간이 생긴다.
 *
 * ⚠️ yearMonth 와 asOf 를 클라이언트가 보낸다. 서버는 now() 를 부르지 않는다.
 *    서버는 UTC 로 돌기 때문에 서버가 판정하면 매월 1일 0~9시에
 *    사용자가 지난달 대시보드를 보게 된다.
 */
export function useMonthlyStats(yearMonth: string, asOf: string) {
  return useQuery({
    queryKey: queryKeys.statsMonthly({ yearMonth, asOf }),
    queryFn: () =>
      request<MonthlyStatsResponse>("/api/v1/stats/monthly", {
        searchParams: { yearMonth, asOf },
      }),
    enabled: Boolean(yearMonth) && Boolean(asOf),
  });
}

/**
 * 고정지출 자동 감지.
 *
 * 대시보드 본문과 분리한 이유는 성질이 다르기 때문이다 —
 * 최근 3개월 전체를 스캔해 비용이 크고, 결과가 월 단위로만 바뀌어 캐시 수명이 길다.
 * 첫 페인트를 지연시키지 않도록 별도 요청으로 둔다.
 */
export function useRecurring(asOf: string) {
  return useQuery({
    queryKey: queryKeys.statsRecurring({ asOf }),
    queryFn: () =>
      request<RecurringResponse[]>("/api/v1/stats/recurring", {
        searchParams: { asOf },
      }),
    enabled: Boolean(asOf),
    staleTime: 10 * 60_000, // 월 단위로만 바뀐다
  });
}
