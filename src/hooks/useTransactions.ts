"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { request } from "@/lib/apiClient";
import { INVALIDATE_ON_TRANSACTION_CHANGE, queryKeys } from "@/lib/queryKeys";
import type { TransactionListParams } from "@/lib/queryKeys";
import type { PageResponse, TransactionResponse, TransactionType } from "@/types/api";

/** 생성·수정이 공유하는 요청 바디. PUT 은 전체 교체이므로 모양이 같다 */
export interface TransactionInput {
  categoryId: number;
  type: TransactionType;
  amount: number;
  txnDate: string;
  /** 빈 문자열이 아니라 null 을 보낸다. PUT 에서 누락은 값 삭제로 취급된다 */
  merchant: string | null;
  memo: string | null;
}

export function useTransactionList(params: TransactionListParams) {
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () =>
      request<PageResponse<TransactionResponse>>("/api/v1/transactions", {
        searchParams: { ...params },
      }),
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => request<TransactionResponse>(`/api/v1/transactions/${id}`),
    enabled: Number.isFinite(id),
  });
}

/**
 * 거래를 바꾸면 stats·budgets 도 함께 무효화한다.
 * 빼먹으면 거래를 추가했는데 대시보드 합계가 그대로다.
 */
function useInvalidateOnChange() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of INVALIDATE_ON_TRANSACTION_CHANGE) {
      queryClient.invalidateQueries({ queryKey: [...key] });
    }
  };
}

/**
 * 생성은 낙관적으로 그리지 않는다.
 * 서버가 채우는 id 와 카테고리 조인 결과가 있어 임시 데이터와 실제가 어긋난다.
 * 로컬 API 는 수십 ms 라 버튼 로딩 상태만으로 충분하다.
 */
export function useCreateTransaction() {
  const invalidate = useInvalidateOnChange();
  return useMutation({
    mutationFn: (body: TransactionInput) =>
      request<TransactionResponse>("/api/v1/transactions", { method: "POST", body }),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction(id: number) {
  const invalidate = useInvalidateOnChange();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TransactionInput) =>
      request<TransactionResponse>(`/api/v1/transactions/${id}`, { method: "PUT", body }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.transaction(id), updated);
      invalidate();
    },
  });
}

/**
 * 삭제만 낙관적 업데이트를 적용한다.
 * 결과가 자명하고(행이 사라진다) 되돌리기도 쉽다.
 */
export function useDeleteTransaction(params?: TransactionListParams) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOnChange();
  const listKey = params ? queryKeys.transactions(params) : null;

  return useMutation({
    mutationFn: (id: number) =>
      request<void>(`/api/v1/transactions/${id}`, { method: "DELETE" }),

    onMutate: async (id) => {
      // 상세 화면에서 부르면 대상 목록이 없다. 그때는 낙관적 업데이트 없이 응답을 기다린다
      if (!listKey) {
        return { previous: undefined };
      }
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<PageResponse<TransactionResponse>>(listKey);
      if (previous) {
        queryClient.setQueryData<PageResponse<TransactionResponse>>(listKey, {
          ...previous,
          content: previous.content.filter((t) => t.id !== id),
          totalElements: Math.max(0, previous.totalElements - 1),
        });
      }
      return { previous };
    },

    onError: (_error, _id, context) => {
      if (listKey && context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },

    onSettled: invalidate,
  });
}
