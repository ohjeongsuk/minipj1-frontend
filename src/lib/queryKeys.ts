/**
 * React Query 키 규약. CLAUDE.md 9장 표를 상수로 옮긴 것이다.
 *
 * 문자열을 화면마다 직접 쓰면 오타 하나로 캐시가 갈라지고,
 * 무효화가 조용히 아무것도 하지 않는다.
 */

export interface TransactionListParams {
  page?: number;
  size?: number;
  type?: string;
  categoryId?: number;
  from?: string;
  to?: string;
  keyword?: string;
  sort?: string;
}

export const queryKeys = {
  /** 거래 목록. 화면의 필터·페이지가 그대로 키에 들어가 URL 상태와 1:1 로 대응한다 */
  transactions: (params: TransactionListParams) => ["transactions", params] as const,
  transaction: (id: number) => ["transactions", id] as const,

  categories: () => ["categories"] as const,

  statsMonthly: (params: { yearMonth: string; asOf: string }) =>
    ["stats", "monthly", params] as const,
  statsRecurring: (params: { asOf: string }) => ["stats", "recurring", params] as const,

  budgets: (params: { yearMonth: string }) => ["budgets", params] as const,

  me: () => ["auth", "me"] as const,
} as const;

/**
 * 거래를 변경하면 함께 무효화해야 하는 키들.
 *
 * ⚠️ ['stats'] 를 빼먹으면 거래를 추가했는데 대시보드 합계가 그대로다.
 *    예산 소진율도 지출에 따라 바뀌므로 ['budgets'] 도 포함한다.
 */
export const INVALIDATE_ON_TRANSACTION_CHANGE = [
  ["transactions"],
  ["stats"],
  ["budgets"],
] as const;
