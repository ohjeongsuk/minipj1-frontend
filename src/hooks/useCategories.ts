"use client";

import { useQuery } from "@tanstack/react-query";

import { request } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { CategoryResponse } from "@/types/api";

/**
 * 카테고리 목록.
 *
 * 선택 UI 용이므로 서버가 이미 deleted_at IS NULL 로 걸러서 준다.
 * 과거 거래에 붙은 삭제된 카테고리는 거래 응답의 category 에 담겨 오므로
 * 이 목록에 없어도 목록 화면이 이름·색을 그릴 수 있다.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => request<CategoryResponse[]>("/api/v1/categories"),
    staleTime: 5 * 60_000, // 자주 바뀌지 않는다
  });
}
