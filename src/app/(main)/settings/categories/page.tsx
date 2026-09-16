"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryForm } from "@/components/category/CategoryForm";
import type { CategoryFormValue } from "@/components/category/CategoryForm";
import { ErrorState } from "@/components/common/ErrorState";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { CategoryResponse, TransactionType } from "@/types/api";

export default function CategoriesPage() {
  const categories = useCategories();
  const [tab, setTab] = useState<TransactionType>("EXPENSE");

  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryResponse | null>(null);
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
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">카테고리 관리</h1>

      <Tabs value={tab} onValueChange={(next) => setTab(next as TransactionType)}>
        <TabsList>
          <TabsTrigger value="EXPENSE">지출</TabsTrigger>
          <TabsTrigger value="INCOME">수입</TabsTrigger>
        </TabsList>

        {(["EXPENSE", "INCOME"] as const).map((value) => (
          <TabsContent key={value} value={value} className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {visible.map((category) => (
                <li key={category.id} className="rounded-xl border border-border p-3">
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
                        className="size-3 shrink-0 rounded-full"
                        style={{ background: safeColor(category.color, "#737373") }}
                      />
                      <span className="min-w-0 flex-1 truncate text-body">{category.name}</span>
                      <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
                        순서 {category.sortOrder}
                      </span>
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
              />
            </section>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => (next ? undefined : setPendingDelete(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>&apos;{pendingDelete?.name}&apos; 카테고리를 삭제할까요?</DialogTitle>
            {/* 이 문구가 없으면 과거 데이터가 사라진다고 오해한다 (CAT-03) */}
            <DialogDescription>
              이 카테고리를 쓰는 과거 내역은 그대로 남습니다. 새 거래에서만 선택할 수 없게 됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              취소
            </Button>
            <Button onClick={handleDelete} disabled={remove.isPending}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
