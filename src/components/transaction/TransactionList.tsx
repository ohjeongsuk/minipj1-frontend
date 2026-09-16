"use client";

import { Inbox, SearchX } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { TransactionRow } from "@/components/transaction/TransactionRow";
import { ApiRequestError } from "@/lib/apiClient";
import { resolveError } from "@/lib/errorMessages";
import type { PageResponse, TransactionResponse } from "@/types/api";

/**
 * 목록 + 로딩 · 빈 상태 · 검색 결과 없음 · 에러 분기.
 *
 * ⚠️ "아직 기록이 없어요"와 "조건에 맞는 내역이 없어요"를 구분한다.
 *    같은 문구를 쓰면 사용자가 필터를 걸어둔 사실을 알아채지 못한다 (UX-02 · UX-03).
 *
 * 삭제는 낙관적 업데이트라 캐시에서 먼저 빠진다. AnimatePresence 로 감싸야
 * 사라지는 행이 한 프레임 만에 없어지지 않고 exit 애니메이션을 마칠 수 있다.
 * initial={false} 를 주어 첫 렌더에서 목록 전체가 다시 등장하지 않게 한다.
 */
interface TransactionListProps {
  data: PageResponse<TransactionResponse> | undefined;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  /** 필터·검색이 하나라도 걸려 있는지 */
  filtered: boolean;
  onRetry: () => void;
  onDelete: (id: number) => void;
  onFocusQuickAdd: () => void;
  onResetFilters: () => void;
}

export function TransactionList({
  data,
  isPending,
  isFetching,
  error,
  filtered,
  onRetry,
  onDelete,
  onFocusQuickAdd,
  onResetFilters,
}: TransactionListProps) {
  if (isPending) {
    return <ListSkeleton rows={5} />;
  }

  if (error) {
    const apiError = error instanceof ApiRequestError ? error.error : null;
    return (
      <ErrorState message={resolveError(apiError).message} onRetry={onRetry} retrying={isFetching} />
    );
  }

  if (!data || data.content.length === 0) {
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="조건에 맞는 내역이 없어요"
        description="기간·구분·카테고리나 검색어를 바꿔 보세요."
        actionLabel="필터 초기화"
        onAction={onResetFilters}
      />
    ) : (
      <EmptyState
        icon={Inbox}
        title="아직 기록이 없어요"
        description="위 입력 바에서 첫 거래를 기록해 보세요."
        actionLabel="입력 바로 이동"
        onAction={onFocusQuickAdd}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {data.content.map((transaction, index) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            index={index}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
