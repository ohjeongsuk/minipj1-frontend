"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransactionInput } from "@/hooks/useTransactions";
import { safeColor } from "@/lib/color";
import { today } from "@/lib/date";
import { formatAmount, parseAmount } from "@/lib/money";
import type { CategoryResponse, TransactionResponse, TransactionType } from "@/types/api";

/**
 * 거래 입력 폼 본체. 퀵 입력 바와 상세 화면이 공유한다.
 * 초기값 유무와 layout 으로만 구분하고, 검증·정규화 규칙은 한 곳에 둔다.
 *
 * ⚠️ 카테고리와 날짜에 shadcn Select / Calendar 를 쓰지 않고 네이티브 요소를 쓴다.
 *    둘 다 Enter 를 자기 동작(항목 선택 / 날짜 선택)에 써버려서
 *    "어느 필드에서든 Enter 로 저장"이라는 키보드 완주 요구(UX-06)가 깨진다.
 *    네이티브 select 는 방향키로 값을 바꾸고 Enter 는 폼 제출로 흘러간다.
 */
interface TransactionFormProps {
  categories: CategoryResponse[];
  /** 상세 화면의 초기값. 없으면 신규 입력이다 */
  initial?: TransactionResponse;
  layout: "quick" | "detail";
  submitting: boolean;
  /** 서버가 준 에러 문구. 폼 위에 인라인으로 붙는다 */
  errorMessage?: string;
  /** 성공하면 금액·카테고리·거래처·메모를 비운다. 날짜와 구분은 유지한다 */
  clearOnSuccess?: boolean;
  /** 최근 사용 카테고리 id 3개. 퀵 입력 바에서만 쓴다 */
  recentCategoryIds?: number[];
  onSubmit: (input: TransactionInput) => Promise<unknown>;
  onDirtyChange?: (dirty: boolean) => void;
  /** 상세 화면의 삭제 · 목록으로 버튼 */
  footer?: React.ReactNode;
}

const NO_CATEGORY = "";

export function TransactionForm({
  categories,
  initial,
  layout,
  submitting,
  errorMessage,
  clearOnSuccess = false,
  recentCategoryIds = [],
  onSubmit,
  onDirtyChange,
  footer,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? "EXPENSE");
  // 금액은 콤마 없는 원본 문자열로 든다. 표시할 때만 포맷한다
  const [amountRaw, setAmountRaw] = useState(initial ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(initial ? String(initial.category.id) : NO_CATEGORY);
  const [txnDate, setTxnDate] = useState(initial?.txnDate ?? today());
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [localError, setLocalError] = useState("");

  const isQuick = layout === "quick";
  const selectable = categories.filter((c) => c.type === type);
  const hasCategories = categories.length > 0;

  /*
   * dirty 판정에서 금액은 콤마를 제거한 뒤 숫자로 비교한다.
   * 표시값 "1,250,000" 을 초기값 1250000 과 그대로 비교하면
   * 손대지 않은 폼도 변경된 것으로 잡혀 이탈 확인창이 항상 뜬다.
   * 문자열끼리 비교하지 않는 이유는 "012500"·"12500.0" 같은 표기 차이까지 걸러내기 위해서다.
   */
  const dirty = initial
    ? Number(parseAmount(amountRaw)) !== Number(initial.amount) ||
      type !== initial.type ||
      categoryId !== String(initial.category.id) ||
      txnDate !== initial.txnDate ||
      merchant !== (initial.merchant ?? "") ||
      memo !== (initial.memo ?? "")
    : false;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  /** 구분을 바꿨는데 고른 카테고리가 그 구분이 아니면 비운다 (CATEGORY_TYPE_MISMATCH 예방) */
  function changeType(next: TransactionType) {
    setType(next);
    const current = categories.find((c) => String(c.id) === categoryId);
    if (current && current.type !== next) {
      setCategoryId(NO_CATEGORY);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError("");

    const amount = Number(parseAmount(amountRaw));
    if (!Number.isFinite(amount) || amount <= 0) {
      setLocalError("금액은 0보다 커야 합니다.");
      return;
    }
    if (categoryId === NO_CATEGORY) {
      setLocalError("카테고리를 선택해 주세요.");
      return;
    }
    if (!txnDate) {
      setLocalError("날짜를 선택해 주세요.");
      return;
    }

    try {
      await onSubmit({
        categoryId: Number(categoryId),
        type,
        amount,
        txnDate,
        // PUT 은 전체 교체다. 빈 문자열을 그대로 보내면 값 삭제가 아니라 빈 문자열이 저장된다
        merchant: merchant.trim() || null,
        memo: memo.trim() || null,
      });
    } catch {
      // 실패하면 폼 내용을 그대로 둔다 (TXN-11). 에러 문구는 부모가 errorMessage 로 넘긴다
      return;
    }

    if (clearOnSuccess) {
      setAmountRaw("");
      setCategoryId(NO_CATEGORY);
      setMerchant("");
      setMemo("");
      // 날짜와 구분은 그대로 둔다. 연속 입력을 위해서다 (TXN-02)
    }
  }

  const labelClass = isQuick ? "sr-only" : "";
  const cellClass = isQuick ? "sm:col-span-2" : "sm:col-span-6";
  const recent = recentCategoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is CategoryResponse => c !== undefined && c.type === type);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("flex flex-col gap-3", isQuick && "rounded-xl border border-border p-4")}
    >
      {!hasCategories ? (
        <p role="alert" className="text-caption text-muted-foreground">
          카테고리를 먼저 만들어 주세요.{" "}
          <a
            href="/settings/categories"
            className="font-medium text-foreground underline underline-offset-4"
          >
            카테고리 관리로 이동
          </a>
        </p>
      ) : null}

      {errorMessage || localError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 px-3 py-2 text-caption text-destructive"
        >
          {errorMessage || localError}
        </p>
      ) : null}

      <fieldset disabled={!hasCategories || submitting} className="grid gap-3 sm:grid-cols-12">
        <legend className="sr-only">거래 입력</legend>

        {/* 구분 — 라디오라 방향키로 바꿀 수 있고 Enter 는 폼 제출로 흘러간다 */}
        <div className={cn("flex flex-col gap-1.5", cellClass)}>
          <span className={cn("text-sm leading-none font-medium", labelClass)}>구분</span>
          <div className="flex h-8 items-center gap-1 rounded-lg border border-input p-0.5">
            {(["EXPENSE", "INCOME"] as const).map((value) => (
              <label
                key={value}
                className={cn(
                  "flex-1 cursor-pointer rounded-md px-2 py-1 text-center text-caption transition-colors",
                  type === value && value === "INCOME" && "bg-income/15 font-semibold text-income",
                  type === value && value === "EXPENSE" && "bg-expense/15 font-semibold text-expense",
                  type !== value && "text-muted-foreground",
                )}
              >
                <input
                  type="radio"
                  name={`${layout}-type`}
                  value={value}
                  checked={type === value}
                  onChange={() => changeType(value)}
                  className="sr-only"
                />
                {value === "INCOME" ? "수입" : "지출"}
              </label>
            ))}
          </div>
        </div>

        {/* 금액 — type="number" 를 쓰지 않는다. 콤마가 들어가는 순간 값이 빈 문자열이 된다 */}
        <div className={cn("flex flex-col gap-1.5", cellClass)}>
          <Label htmlFor={`${layout}-amount`} className={labelClass}>
            금액
          </Label>
          <Input
            id={`${layout}-amount`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            className="text-right tabular-nums"
            value={formatAmount(amountRaw)}
            onChange={(e) => setAmountRaw(parseAmount(e.target.value))}
          />
        </div>

        <div className={cn("flex flex-col gap-1.5", cellClass)}>
          <Label htmlFor={`${layout}-category`} className={labelClass}>
            카테고리
          </Label>
          <select
            id={`${layout}-category`}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value={NO_CATEGORY}>선택</option>
            {selectable.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 날짜 — 네이티브 date 입력이 yyyy-MM-dd 를 그대로 주고받는다 */}
        <div className={cn("flex flex-col gap-1.5", cellClass)}>
          <Label htmlFor={`${layout}-date`} className={labelClass}>
            날짜
          </Label>
          <Input
            id={`${layout}-date`}
            type="date"
            value={txnDate}
            onChange={(e) => setTxnDate(e.target.value)}
          />
        </div>

        <div className={cn("flex flex-col gap-1.5", cellClass)}>
          <Label htmlFor={`${layout}-merchant`} className={labelClass}>
            거래처
          </Label>
          <Input
            id={`${layout}-merchant`}
            type="text"
            autoComplete="off"
            maxLength={100}
            placeholder="거래처"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </div>

        <div className={cn("flex flex-col gap-1.5", cellClass)}>
          <Label htmlFor={`${layout}-memo`} className={labelClass}>
            메모
          </Label>
          <Input
            id={`${layout}-memo`}
            type="text"
            autoComplete="off"
            maxLength={500}
            placeholder="메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </fieldset>

      <div className={cn("flex flex-wrap items-center gap-2", !isQuick && "justify-end")}>
        {/* 최근 사용 카테고리. type="button" 이 아니면 누르는 순간 폼이 제출된다 */}
        {isQuick
          ? recent.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(String(c.id))}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-caption transition-colors",
                  categoryId === String(c.id) ? "border-ring font-semibold" : "border-border",
                )}
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ background: safeColor(c.color, "#737373") }}
                />
                {c.name}
              </button>
            ))
          : null}

        {footer}
        <Button
          type="submit"
          disabled={!hasCategories || submitting}
          className={cn(isQuick && "ml-auto")}
        >
          {submitting ? "저장 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
