"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryForm } from "@/components/category/CategoryForm";
import type { CategoryFormValue } from "@/components/category/CategoryForm";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/useCategoryMutations";
import { ApiRequestError } from "@/lib/apiClient";
import { safeColor } from "@/lib/color";
import { resolveError } from "@/lib/errorMessages";
import { HAIRLINE_ITEM, HAIRLINE_LIST } from "@/lib/utils";
import type { CategoryResponse, TransactionType } from "@/types/api";

export default function CategoriesPage() {
  const categories = useCategories();
  const [tab, setTab] = useState<TransactionType>("EXPENSE");

  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryResponse | null>(null);
  // 추가 폼은 접어 둔다. 목록이 이 화면의 본문이고 추가는 가끔 하는 일이다
  const [addingFor, setAddingFor] = useState<TransactionType | null>(null);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  if (categories.isPending) {
    return <ListSkeleton rows={6} />;
  }

  if (categories.error || !categories.data) {
    const apiError = categories.error instanceof ApiRequestError ? categories.error.error : null;
    return (
      <ErrorState
        message={resolveError(apiError).message}
        onRetry={() => void categories.refetch()}
        retrying={categories.isFetching}
      />
    );
  }

  const visible = categories.data.filter((c) => c.type === tab);

  async function handleCreate(value: CategoryFormValue) {
    setCreateError("");
    try {
      await create.mutateAsync({ ...value, type: tab });
      toast.success("카테고리를 추가했습니다.");
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      setCreateError(resolveError(apiError).message);
      throw error;
    }
  }

  async function handleUpdate(id: number, value: CategoryFormValue) {
    setEditError("");
    try {
      // type 은 보내지 않는다. 구분은 생성 후 바꿀 수 없다
      await update.mutateAsync({ id, ...value });
      setEditingId(null);
      toast.success("카테고리를 수정했습니다.");
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      setEditError(resolveError(apiError).message);
      throw error;
    }
  }

  /*
   * 순서 바꾸기. 이웃과 자리를 맞바꾸고 두 항목만 다시 저장한다.
   *
   * ⚠️ 두 항목의 sortOrder 값을 서로 교환하지 않고 **새 자리의 인덱스**를 쓴다.
   *    값 교환은 두 항목의 sortOrder 가 같을 때(사용자가 수정 폼에서 직접
   *    같은 값을 넣을 수 있다) 아무 일도 일어나지 않는다. 인덱스를 쓰면
   *    그런 목록도 누를 때마다 0,1,2... 로 스스로 정리된다.
   *
   * ⚠️ 움직인 둘만 저장한다. 목록 전체를 renumber 하면 카테고리 수만큼
   *    PUT 이 나가는데, 얻는 것은 "값이 항상 연속" 뿐이다. 정렬은
   *    sortOrder ASC, id ASC 라 연속이 아니어도 순서는 정확하다.
   */
  async function handleMove(index: number, direction: -1 | 1) {
    const target = visible[index];
    const neighbor = visible[index + direction];
    if (!target || !neighbor) {
      return;
    }
    try {
      await Promise.all([
        update.mutateAsync({
          id: target.id,
          name: target.name,
          color: target.color,
          sortOrder: index + direction,
        }),
        update.mutateAsync({
          id: neighbor.id,
          name: neighbor.name,
          color: neighbor.color,
          sortOrder: index,
        }),
      ]);
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      toast.error(resolveError(apiError).message);
    }
  }

  function handleDelete() {
    if (!pendingDelete) {
      return;
    }
    const target = pendingDelete;
    setPendingDelete(null);
    remove.mutate(target.id, {
      onSuccess: () => toast.success(`'${target.name}'을(를) 삭제했습니다.`),
      onError: (error) => {
        const apiError = error instanceof ApiRequestError ? error.error : null;
        toast.error(resolveError(apiError).message);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">카테고리 관리</h1>

      <Tabs value={tab} onValueChange={(next) => setTab(next as TransactionType)}>
        <TabsList>
          <TabsTrigger value="EXPENSE">지출</TabsTrigger>
          <TabsTrigger value="INCOME">수입</TabsTrigger>
        </TabsList>

        {(["EXPENSE", "INCOME"] as const).map((value) => (
          <TabsContent key={value} value={value} className="flex flex-col gap-6">
            <ul className={HAIRLINE_LIST}>
              {visible.map((category, index) => (
                <li key={category.id} className={`p-3 ${HAIRLINE_ITEM}`}>
                  {editingId === category.id ? (
                    <CategoryForm
                      initial={category}
                      type={category.type}
                      submitting={update.isPending}
                      errorMessage={editError}
                      onSubmit={(formValue) => handleUpdate(category.id, formValue)}
                      onCancel={() => {
                        setEditingId(null);
                        setEditError("");
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                      >
                        <span
                          className="size-3 rounded-full"
                          style={{ background: safeColor(category.color, "#737373") }}
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-item font-semibold">
                        {category.name}
                      </span>
                      {/*
                        예전에는 여기에 "순서 0" 처럼 sortOrder 값을 적었다.
                        0 부터 시작하는 내부 인덱스라 사용자에게는 뜻이 없고
                        "0 번이 뭐지" 만 남았다. 값을 보여주는 대신 바꾸게 한다.
                      */}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${category.name} 위로`}
                        disabled={index === 0 || update.isPending}
                        onClick={() => void handleMove(index, -1)}
                      >
                        <ChevronUp className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${category.name} 아래로`}
                        disabled={index === visible.length - 1 || update.isPending}
                        onClick={() => void handleMove(index, 1)}
                      >
                        <ChevronDown className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${category.name} 수정`}
                        onClick={() => {
                          setEditingId(category.id);
                          setEditError("");
                        }}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${category.name} 삭제`}
                        onClick={() => setPendingDelete(category)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {addingFor === value ? (
              <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <h2 className="text-caption text-muted-foreground">
                  {value === "EXPENSE" ? "지출" : "수입"} 카테고리 추가
                </h2>
                {/* 구분은 현재 탭이 정한다. 폼에 구분 입력이 없다 */}
                <CategoryForm
                  type={value}
                  submitting={create.isPending}
                  errorMessage={createError}
                  onSubmit={handleCreate}
                  onCancel={() => {
                    setAddingFor(null);
                    setCreateError("");
                  }}
                />
              </section>
            ) : (
              /*
               * 목록 끝에 가운데 정렬로 둔다. 목록보다 좁게 두어
               * 항목 하나가 아니라 목록 전체에 대한 동작임을 위치로 드러낸다.
               * 추가 후에도 폼은 닫지 않는다 - 여러 개를 연달아 만드는 경우가 많다.
               */
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddingFor(value);
                    setCreateError("");
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  {value === "EXPENSE" ? "지출" : "수입"} 카테고리 추가
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`'${pendingDelete?.name}' 카테고리를 삭제할까요?`}
        // 이 문구가 없으면 과거 데이터가 사라진다고 오해한다 (CAT-03)
        description="이 카테고리를 쓰는 과거 내역은 그대로 남습니다. 새 거래에서만 선택할 수 없게 됩니다."
        pending={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
