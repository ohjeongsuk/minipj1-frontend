"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { currentMonth, formatMonthLabel, shiftMonth } from "@/lib/date";

/**
 * ◀ 2026년 9월 ▶
 *
 * 선택한 달은 URL 쿼리(?ym=)로 관리한다. 그래야 새로고침해도 유지되고
 * 뒤로가기가 앱을 벗어나지 않고 이전 달로 돌아간다.
 *
 * 기본은 미래 달 이동 금지다. 아직 오지 않은 달의 집계는 전부 0 이고 예측도 의미가 없다.
 * 다만 예산 화면은 allowFuture 로 이 제한을 푼다 — 예산은 앞을 내다보는 기능이라
 * 다음 달 예산을 미리 짜는 것이 자연스럽다.
 */
interface MonthPickerProps {
  yearMonth: string;
  onChange: (next: string) => void;
  allowFuture?: boolean;
}

export function MonthPicker({ yearMonth, onChange, allowFuture = false }: MonthPickerProps) {
  // yyyy-MM 은 문자열 정렬이 곧 시간 정렬이라 비교가 그대로 동작한다
  const atCurrentMonth = !allowFuture && yearMonth >= currentMonth();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="이전 달"
        onClick={() => onChange(shiftMonth(yearMonth, -1))}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>

      {/* 조회 대상 월은 내비게이션이지 데이터가 아니다. 잔액보다 작게 둔다 */}
      <h1 className="min-w-32 text-center text-xl font-semibold tabular-nums sm:min-w-36 sm:text-2xl">
        {formatMonthLabel(yearMonth)}
      </h1>

      <Button
        variant="outline"
        size="icon"
        aria-label="다음 달"
        disabled={atCurrentMonth}
        onClick={() => onChange(shiftMonth(yearMonth, 1))}
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
