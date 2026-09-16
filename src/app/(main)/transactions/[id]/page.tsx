"use client";

import { FileQuestion } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { TransactionForm } from "@/components/transaction/TransactionForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCategories } from "@/hooks/useCategories";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import type { TransactionInput } from "@/hooks/useTransactions";
import {
  useDeleteTransaction,
  useTransaction,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import { ApiRequestError } from "@/lib/apiClient";
import { resolveError } from "@/lib/errorMessages";

/**
 * 거래 상세 (TXN-09 ~ TXN-12).
 *
 * 진입 즉시 모든 필드가 편집 가능하다. 보기/편집 모드를 나누지 않는다.
 * 퀵 입력 바와 같은 TransactionForm 을 초기값·삭제 버튼만 달리해 재사용한다.
 *
 * ⚠️ 동적 라우트 파라미터는 useParams() 로 읽는다.
 *    Next.js 15 부터 페이지 props 의 params 는 Promise 라 React.use() 로 풀어야 하고
 *    동기 접근 호환 모드는 16 에서 제거됐다. useParams 는 동기 훅이라 이 변경과 무관하다.
 */
export default function TransactionDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = Number(routeParams.id);

  const categories = useCategories();
  const query = useTransaction(id);
  const update = useUpdateTransaction(id);
  const remove = useDeleteTransaction();

  const [dirty, setDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { guard, open, confirmLeave, cancelLeave } = useLeaveGuard(dirty);

  const goToList = useCallback(() => router.push("/transactions"), [router]);

  async function handleSubmit(input: TransactionInput) {
    setErrorMessage("");
    try {
      await update.mutateAsync(input);
      toast.success("거래를 수정했습니다.");
      // 저장 성공으로 initial 이 갱신되어 dirty 가 false 가 되고 가드가 풀린다
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      setErrorMessage(resolveError(apiError).message);
      throw error; // 폼 내용을 유지하기 위해 다시 던진다 (TXN-11)
    }
  }

  function handleDelete() {
    remove.mutate(id, {
      onSuccess: () => {
        toast.success("거래를 삭제했습니다.");
        router.replace("/transactions");
      },
      onError: () => toast.error("삭제에 실패했습니다."),
    });
  }

  if (query.isPending || categories.isPending) {
    return <ListSkeleton rows={3} />;
  }

  /*
   * 없는 id 이거나 타인 소유이면 서버가 404 로 답한다(존재 여부를 노출하지 않기 위해).
   * 목록으로 자동 리다이렉트하지 않고 전용 화면을 보여준다.
   * Next.js 의 notFound() 는 쓰지 않는다 — 클라이언트 데이터 페칭이라 서버가 알 수 없다.
   */
  if (query.error instanceof ApiRequestError && query.error.status === 404) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="거래 내역을 찾을 수 없습니다"
        description="삭제되었거나 접근할 수 없는 거래입니다."
        actionLabel="목록으로 가기"
        onAction={goToList}
      />
    );
  }

  if (query.error || !query.data) {
    const apiError = query.error instanceof ApiRequestError ? query.error.error : null;
    return (
      <ErrorState
        message={resolveError(apiError).message}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">거래 상세</h1>

      <TransactionForm
        categories={categories.data ?? []}
        initial={query.data}
        layout="detail"
        submitting={update.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onDirtyChange={setDirty}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => guard(goToList)}>
              목록으로
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={remove.isPending}
              onClick={handleDelete}
              className="text-destructive"
            >
              삭제
            </Button>
          </>
        }
      />

      {/* 이탈 확인 (TXN-09). 새로고침·탭닫기는 브라우저 기본 대화상자가 맡는다 */}
      <Dialog open={open} onOpenChange={(next) => (next ? undefined : cancelLeave())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>저장하지 않고 나갈까요?</DialogTitle>
            <DialogDescription>변경한 내용이 사라집니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelLeave}>
              계속 편집
            </Button>
            <Button onClick={confirmLeave}>나가기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
