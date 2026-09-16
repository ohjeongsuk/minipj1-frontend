/**
 * 백엔드 DTO 와 이름을 맞춘 응답 타입.
 * 여기에 한 번만 정의하고 재사용한다. 컴포넌트 안에서 인라인으로 다시 선언하지 않는다.
 */

/** 모든 REST 응답의 공통 봉투. 유일한 예외는 GET /data/export (CSV 바이트) */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

/** PageResponse 는 최상위가 아니라 data 안에 들어간다 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type TransactionType = "INCOME" | "EXPENSE";

export interface MeResponse {
  id: number;
  email: string;
  nickname: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
  sortOrder: number;
  deleted: boolean;
}

/** 거래 목록에 함께 내려오는 카테고리 요약 */
export interface CategorySummary {
  id: number;
  name: string;
  color: string;
  deleted: boolean;
}

export interface TransactionResponse {
  id: number;
  type: TransactionType;
  amount: number;
  txnDate: string;
  merchant: string | null;
  memo: string | null;
  category: CategorySummary;
}

export interface BudgetResponse {
  categoryId: number;
  name: string;
  color: string;
  /** 미설정이면 null. 0 과 구분한다 */
  amount: number | null;
}

/** 월 대시보드 일괄 응답 */
export interface MonthlyStatsResponse {
  yearMonth: string;
  summary: StatsSummary;
  byCategory: CategoryStat[];
  daily: DailyStat[];
  /** 직전 3개월에 거래가 없으면 null 이다 */
  forecast: Forecast | null;
  anomalies: Anomaly[];
  budgets: BudgetStat[];
}

export interface StatsSummary {
  income: number;
  expense: number;
  net: number;
}

export interface CategoryStat {
  categoryId: number;
  name: string;
  color: string;
  deleted: boolean;
  amount: number;
  ratio: number;
}

export interface DailyStat {
  date: string;
  expense: number;
  income: number;
}

export interface Forecast {
  confirmedExpense: number;
  projectedExpense: number;
  baselineDailyAvg: number;
  daysElapsed: number;
  daysInMonth: number;
  basisMonths: number;
}

export interface Anomaly {
  categoryId: number;
  name: string;
  currentPace: number;
  baseline: number;
  deltaRatio: number;
}

export interface BudgetStat {
  categoryId: number;
  name: string;
  budget: number;
  spent: number;
  usageRatio: number;
  exceeded: boolean;
}

export interface RecurringResponse {
  merchant: string;
  categoryId: number;
  medianAmount: number;
  monthsSeen: number;
  lastDate: string;
}

export interface ImportResultResponse {
  imported: number;
  failed: number;
  errors: ImportRowError[];
}

export interface ImportRowError {
  line: number;
  reason: string;
}
