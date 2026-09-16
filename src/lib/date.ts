import { addMonths, format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 날짜 포맷·파싱. 모든 화면이 이 함수들만 쓴다.
 *
 * ⚠️ toISOString() 을 쓰지 않는다.
 *    로컬 시각을 UTC 로 변환하므로 KST 오전 9시 이전에는 날짜가 하루 밀린다.
 *    서버가 "오늘"을 판정하지 않기로 한 것과 같은 문제가 프론트에서 재현된다.
 *    date-fns 의 format 은 로컬 타임존 기준으로 문자열을 만든다.
 */

/** API 가 주고받는 날짜 형식 */
export const API_DATE = "yyyy-MM-dd";
export const API_MONTH = "yyyy-MM";

/** 사용자의 "오늘". asOf 파라미터로 서버에 보낸다 */
export function today(): string {
  return format(new Date(), API_DATE);
}

/** 사용자의 "이번 달". yearMonth 파라미터로 서버에 보낸다 */
export function currentMonth(): string {
  return format(new Date(), API_MONTH);
}

export function toApiDate(date: Date): string {
  return format(date, API_DATE);
}

export function toApiMonth(date: Date): string {
  return format(date, API_MONTH);
}

/** "2026-09-14" → Date. 타임존 변환 없이 로컬 날짜로 읽는다 */
export function fromApiDate(value: string): Date {
  return parseISO(value);
}

/** 목록에 쓰는 짧은 표시: "9월 14일 (월)" */
export function formatListDate(value: string): string {
  return format(parseISO(value), "M월 d일 (E)", { locale: ko });
}

/** 상세·헤더에 쓰는 표시: "2026년 9월 14일" */
export function formatFullDate(value: string): string {
  return format(parseISO(value), "yyyy년 M월 d일", { locale: ko });
}

/** 대시보드 헤더: "2026년 9월" */
export function formatMonthLabel(yearMonth: string): string {
  return format(parseISO(`${yearMonth}-01`), "yyyy년 M월", { locale: ko });
}

/** 월 이동 (대시보드의 ◀ ▶) */
export function shiftMonth(yearMonth: string, delta: number): string {
  const base = parseISO(`${yearMonth}-01`);
  return format(delta >= 0 ? addMonths(base, delta) : subMonths(base, -delta), API_MONTH);
}

/** 해당 월의 시작일·종료일 (기간 필터 기본값) */
export function monthRange(yearMonth: string): { from: string; to: string } {
  const base = parseISO(`${yearMonth}-01`);
  return { from: toApiDate(startOfMonth(base)), to: toApiDate(endOfMonth(base)) };
}

/**
 * createdAt 등 ISO-8601 UTC 문자열을 로컬 시각으로 표시한다.
 * 서버·DB 는 UTC 로 저장하고, 변환은 표시 시점에만 한다.
 */
export function formatDateTime(isoUtc: string): string {
  return format(parseISO(isoUtc), "yyyy-MM-dd HH:mm", { locale: ko });
}
