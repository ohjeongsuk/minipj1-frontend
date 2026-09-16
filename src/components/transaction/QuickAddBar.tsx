"use client";

import { useState } from "react";

import { TransactionForm } from "@/components/transaction/TransactionForm";
import type { TransactionInput } from "@/hooks/useTransactions";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { ApiRequestError } from "@/lib/apiClient";
import { resolveError } from "@/lib/errorMessages";
import type { CategoryResponse, TransactionResponse } from "@/types/api";

/**
 * 퀵 입력 바 (TXN-01 ~ TXN-05).
 *
 * 목록 화면을 떠나지 않고 등록한다. /transactions/new 페이지를 만들지 않는 이유가 이것이다 —
 * 목록 → 새로 만들기 → 페이지 이동 → 입력 → 저장 → 목록 복귀의 다섯 단계가
 * 가계부 앱을 그만두게 만드는 마찰이다.
 *
 * ⚠️ 낙관적 업데이트를 하지 않는다.
 *    서버가 채우는 id 와 카테고리 조인 결과가 있어 임시 데이터와 실제가 어긋난다.
 *    버튼 로딩 상태만 보여주고 응답을 기다린다.
 */
interface QuickAddBarProps {
  categories: CategoryResponse[];
  /** 목록 앞쪽에서 중복 제거해 뽑은 최근 사용 카테고리 3개 */
  recentCategoryIds: number[];
  onCreated: (created: TransactionResponse) => void;
}

export function QuickAddBar({ categories, recentCategoryIds, onCreated }: QuickAddBarProps) {
  const create = useCreateTransaction();
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(input: TransactionInput) {
    setErrorMessage("");
    try {
      onCreated(await create.mutateAsync(input));
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      setErrorMessage(resolveError(apiError).message);
      // 폼을 비우지 않으려면 여기서 다시 던져 TransactionForm 의 clearOnSuccess 를 건너뛴다
      throw error;
    }
  }

  return (
    <TransactionForm
      categories={categories}
      layout="quick"
      submitting={create.isPending}
      errorMessage={errorMessage}
      clearOnSuccess
      recentCategoryIds={recentCategoryIds}
      onSubmit={handleSubmit}
    />
  );
}
