"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { request } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { BudgetResponse } from "@/types/api";

/**
 * 예산 목록. 지출 카테고리 전체가 내려오고 설정된 것만 amount 가 채워진다.
 * 미설정은 amount 가 null 이다(0 과 구분한다).
 */
export function useBudgets(yearMonth: string) {
  return useQuery({
    queryKey: queryKeys.budgets({ yearMonth }),
    queryFn: () =>
      request<BudgetResponse[]>("/api/v1/budgets", { searchParams: { yearMonth } }),
    enabled: Boolean(yearMonth),
  });
}

export interface BudgetUpsertItem {
  categoryId: number;
  /** null 이거나 0 이면 해당 행을 제거한다(미설정으로 되돌림) */
  amount: number | null;
}

/**
 * 한 번에 전체를 upsert 한다. 개별 생성·삭제 경로가 없다.
 *
 * ⚠️ 저장 후 ['stats'] 도 무효화한다.
 *    소진율은 예산 API 가 아니라 stats/monthly 의 budgets 배열에서 내려오므로,
 *    빼먹으면 예산을 바꿨는데 대시보드 막대가 그대로다.
 */
export function useUpsertBudgets(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: BudgetUpsertItem[]) =>
      request<BudgetResponse[]>("/api/v1/budgets", {
        method: "PUT",
        body: { yearMonth, items },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.budgets({ yearMonth }), updated);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
