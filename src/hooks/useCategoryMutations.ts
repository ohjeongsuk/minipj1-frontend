"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { request } from "@/lib/apiClient";
import type { CategoryResponse, TransactionType } from "@/types/api";

/**
 * 카테고리 생성·수정·삭제.
 *
 * ⚠️ 수정 요청에 type 을 담지 않는다. 백엔드의 CategoryUpdateRequest 에 아예 필드가 없다 —
 *    수입 카테고리를 지출로 바꾸면 이미 쌓인 거래의 집계가 통째로 뒤집히기 때문에
 *    API 스펙 수준에서 불가능하게 막아두었다.
 *
 * ⚠️ 카테고리를 바꾸면 거래 목록과 집계도 함께 무효화한다.
 *    목록의 배지 이름·색과 대시보드의 카테고리별 집계가 이 값을 그대로 쓴다.
 */
function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [["categories"], ["transactions"], ["stats"], ["budgets"]]) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export interface CategoryCreateInput {
  name: string;
  type: TransactionType;
  color: string;
  sortOrder: number;
}

/** 수정에는 type 이 없다 */
export type CategoryUpdateInput = Omit<CategoryCreateInput, "type">;

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (body: CategoryCreateInput) =>
      request<CategoryResponse>("/api/v1/categories", { method: "POST", body }),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, ...body }: CategoryUpdateInput & { id: number }) =>
      request<CategoryResponse>(`/api/v1/categories/${id}`, { method: "PUT", body }),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: number) =>
      request<void>(`/api/v1/categories/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
