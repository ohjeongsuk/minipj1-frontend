"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { toast } from "sonner";

import { ListSkeleton } from "@/components/common/ListSkeleton";
import { Pagination } from "@/components/common/Pagination";
import type { TransactionFilters } from "@/components/transaction/FilterBar";
import { EMPTY_FILTERS, FilterBar, hasAnyFilter } from "@/components/transaction/FilterBar";
import { QuickAddBar } from "@/components/transaction/QuickAddBar";
import { TransactionList } from "@/components/transaction/TransactionList";
import { useCategories } from "@/hooks/useCategories";
import { useDeleteTransaction, useTransactionList } from "@/hooks/useTransactions";
import type { TransactionListParams } from "@/lib/queryKeys";
import type { TransactionResponse } from "@/types/api";

const PAGE_SIZE = 20;
const RECENT_LIMIT = 3;

/**
 * ⚠️ useSearchParams 를 쓰는 컴포넌트는 <Suspense> 로 감싸야 한다.
 *    감싸지 않으면 개발 서버에서는 통과하다가 npm run build 의 프리렌더 단계에서 실패한다.
 */
export default function TransactionsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={5} />}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /*
   * 목록 상태를 URL 쿼리로 관리한다.
   * 새로고침해도 유지되고, 뒤로가기가 자연스럽고, 링크 공유가 되며,
   * 쿼리 키가 URL 과 1:1 로 대응해 캐시가 명확해진다.
   */
  const filters: TransactionFilters = {
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    type: searchParams.get("type") ?? "",
    categoryId: searchParams.get("categoryId") ?? "",
    keyword: searchParams.get("keyword") ?? "",
  };
  const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0);

  // 빈 값은 키에서 아예 뺀다. 넣어두면 같은 조회가 다른 캐시 키를 갖는다
  const params: TransactionListParams = {
    page,
    size: PAGE_SIZE,
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: Number(filters.categoryId) } : {}),
    ...(filters.keyword ? { keyword: filters.keyword } : {}),
  };

  const categories = useCategories();
  const list = useTransactionList(params);
  const remove = useDeleteTransaction(params);

  const navigate = useCallback(
    (next: TransactionFilters, nextPage: number) => {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (value) {
          query.set(key, value);
        }
      }
      if (nextPage > 0) {
        query.set("page", String(nextPage));
      }
      const qs = query.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  /** 목록 앞쪽에서 중복 제거해 뽑는다. 별도 API 를 만들지 않는다 (TXN-03) */
  const recentCategoryIds = [
    ...new Set((list.data?.content ?? []).map((t) => t.category.id)),
  ].slice(0, RECENT_LIMIT);

  function handleCreated(created: TransactionResponse) {
    // 등록한 건은 최신 날짜라 1페이지 위쪽에 온다. 뒤 페이지에 있었다면 첫 페이지로 돌린다
    if (page > 0) {
      navigate(filters, 0);
    }
    const keyword = filters.keyword.toLowerCase();
    const hidden =
      (filters.type !== "" && filters.type !== created.type) ||
      (filters.categoryId !== "" && Number(filters.categoryId) !== created.category.id) ||
      (filters.from !== "" && created.txnDate < filters.from) ||
      (filters.to !== "" && created.txnDate > filters.to) ||
      (keyword !== "" &&
        !`${created.merchant ?? ""} ${created.memo ?? ""}`.toLowerCase().includes(keyword));

    if (hidden) {
      toast.info("등록했지만 지금 걸린 필터 조건과 맞지 않아 목록에 보이지 않습니다.");
    } else {
      toast.success("거래를 등록했습니다.");
    }
  }

  function handleDelete(id: number) {
    /*
     * 삭제 전에 미리 판정한다. onSuccess 시점에는 낙관적 업데이트로 이미 행이 빠져 있고,
     * 콜백 클로저의 list.data 도 갱신 전 값이라 세기 어렵다.
     * 페이지 이동은 onMutate 가 아니라 onSuccess 에서 해야 한다 —
     * onMutate 에서 옮기면 쿼리 키가 바뀌어, 실패 시 롤백이 보이지 않는 캐시에 적용된다.
     */
    const wasOnlyItemOnPage = page > 0 && (list.data?.content.length ?? 0) === 1;
    remove.mutate(id, {
      onSuccess: () => {
        if (wasOnlyItemOnPage) {
          navigate(filters, page - 1);
        }
      },
      onError: () => toast.error("삭제에 실패했습니다."),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">거래 내역</h1>

      <QuickAddBar
        categories={categories.data ?? []}
        recentCategoryIds={recentCategoryIds}
        onCreated={handleCreated}
      />

      <FilterBar
        filters={filters}
        categories={categories.data ?? []}
        onChange={(next) => navigate(next, 0)}
      />

      <TransactionList
        data={list.data}
        isPending={list.isPending}
        isFetching={list.isFetching}
        error={list.error}
        filtered={hasAnyFilter(filters)}
        onRetry={() => void list.refetch()}
        onDelete={handleDelete}
        onFocusQuickAdd={() => document.getElementById("quick-amount")?.focus()}
        onResetFilters={() => navigate(EMPTY_FILTERS, 0)}
      />

      <Pagination
        currentPage={page}
        totalPages={list.data?.totalPages ?? 0}
        onPageChange={(next) => navigate(filters, next)}
      />
    </div>
  );
}
