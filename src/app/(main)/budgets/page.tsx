"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { MonthPicker } from "@/components/dashboard/MonthPicker";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBudgets, useUpsertBudgets } from "@/hooks/useBudgets";
import type { BudgetUpsertItem } from "@/hooks/useBudgets";
import { ApiRequestError } from "@/lib/apiClient";
import { safeColor } from "@/lib/color";
import { currentMonth } from "@/lib/date";
import { resolveError } from "@/lib/errorMessages";
import { formatAmount, parseAmount } from "@/lib/money";

/** useSearchParams 를 쓰므로 Suspense 로 감싼다 */
export default function BudgetsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={5} />}>
      <BudgetsContent />
    </Suspense>
  );
}

function BudgetsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const yearMonth = searchParams.get("ym") || currentMonth();
  const budgets = useBudgets(yearMonth);
  const upsert = useUpsertBudgets(yearMonth);

  /*
   * 금액은 콤마 없는 원본 문자열로 든다. categoryId 를 키로 하는 맵이다.
   * 서버 응답이 도착하거나 달이 바뀌면 다시 채운다.
   */
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!budgets.data) {
      return;
    }
    const next: Record<number, string> = {};
    for (const item of budgets.data) {
      // 미설정은 amount 가 null 이다. 빈 문자열로 두어 0 과 구분한다
      next[item.categoryId] = item.amount === null ? "" : String(item.amount);
    }
    setDraft(next);
  }, [budgets.data]);

  function changeMonth(next: string) {
    router.push(next === currentMonth() ? pathname : `${pathname}?ym=${next}`);
  }

  async function handleSave() {
    setErrorMessage("");
    const items: BudgetUpsertItem[] = Object.entries(draft).map(([categoryId, raw]) => ({
      categoryId: Number(categoryId),
      // 빈 값과 0 은 모두 "미설정"이다. 서버가 해당 행을 제거한다
      amount: raw === "" ? null : Number(parseAmount(raw)),
    }));

    try {
      await upsert.mutateAsync(items);
      toast.success("예산을 저장했습니다.");
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      setErrorMessage(resolveError(apiError).message);
    }
  }

  const header = (
    <div className="flex flex-col gap-1">
      {/* 예산은 앞을 내다보는 기능이라 미래 달을 허용한다 */}
      <MonthPicker yearMonth={yearMonth} onChange={changeMonth} allowFuture />
      <p className="text-caption text-muted-foreground">
        지출 카테고리별 월 예산입니다. 비우거나 0으로 두면 미설정이 됩니다.
      </p>
    </div>
  );

  if (budgets.isPending) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <ListSkeleton rows={5} />
      </div>
    );
  }

  if (budgets.error || !budgets.data) {
    const apiError = budgets.error instanceof ApiRequestError ? budgets.error.error : null;
    return (
      <div className="flex flex-col gap-4">
        {header}
        <ErrorState
          message={resolveError(apiError).message}
          onRetry={() => void budgets.refetch()}
          retrying={budgets.isFetching}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 px-3 py-2 text-caption text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {budgets.data.map((item) => (
          <li
            key={item.categoryId}
            className="flex items-center gap-3 rounded-xl border border-border p-3"
          >
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ background: safeColor(item.color, "#737373") }}
            />
            <Label htmlFor={`budget-${item.categoryId}`} className="min-w-0 flex-1 truncate">
              {item.name}
            </Label>
            {/* 금액 입력에 type="number" 를 쓰지 않는다. 콤마가 들어가면 값이 사라진다 */}
            <Input
              id={`budget-${item.categoryId}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="미설정"
              className="w-40 text-right tabular-nums"
              value={formatAmount(draft[item.categoryId] ?? "", 2)}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  [item.categoryId]: parseAmount(e.target.value),
                }))
              }
            />
          </li>
        ))}
      </ul>

      {/* 개별 저장 버튼을 두지 않는다. 한 번에 전체를 upsert 한다 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending ? "저장 중…" : "저장"}
        </Button>
      </div>
    </div>
  );
}
