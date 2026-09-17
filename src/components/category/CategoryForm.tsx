"use client";

import { useState } from "react";

import { ColorPicker } from "@/components/category/ColorPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryResponse, TransactionType } from "@/types/api";
import { INLINE_ERROR } from "@/lib/utils";

/**
 * 카테고리 추가·수정 공용 폼.
 *
 * ⚠️ 구분(수입/지출) 입력을 두지 않는다. 생성 시에는 현재 탭이 곧 구분이고,
 *    수정 시에는 바꿀 수 없다 — 수입 카테고리를 지출로 바꾸면
 *    이미 쌓인 거래의 집계가 통째로 뒤집힌다.
 *    백엔드의 CategoryUpdateRequest 에도 type 필드가 아예 없다.
 */
export interface CategoryFormValue {
  name: string;
  color: string;
  sortOrder: number;
}

interface CategoryFormProps {
  /** 수정 대상. 없으면 추가 폼이다 */
  initial?: CategoryResponse;
  /** 추가 시 어떤 구분으로 만들지. 화면의 현재 탭 값이다 */
  type: TransactionType;
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (value: CategoryFormValue) => Promise<unknown>;
  onCancel?: () => void;
}

const DEFAULT_COLOR = "#737373";

export function CategoryForm({
  initial,
  type,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [localError, setLocalError] = useState("");

  const isEdit = Boolean(initial);
  const idPrefix = isEdit ? `edit-${initial!.id}` : `new-${type}`;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError("");

    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 30) {
      setLocalError("카테고리 이름은 1~30자여야 합니다.");
      return;
    }

    try {
      await onSubmit({ name: trimmed, color, sortOrder: Number(sortOrder) || 0 });
    } catch {
      return; // 실패하면 입력을 그대로 둔다. 문구는 부모가 errorMessage 로 넘긴다
    }

    if (!isEdit) {
      setName("");
      setColor(DEFAULT_COLOR);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      {errorMessage || localError ? (
        <p
          role="alert"
          className={INLINE_ERROR}
        >
          {errorMessage || localError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-12">
        <div className="flex flex-col gap-1.5 sm:col-span-6">
          <Label htmlFor={`${idPrefix}-name`}>이름</Label>
          <Input
            id={`${idPrefix}-name`}
            type="text"
            maxLength={30}
            autoComplete="off"
            placeholder="예: 식비"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <Label htmlFor={`${idPrefix}-order`}>표시 순서</Label>
          <Input
            id={`${idPrefix}-order`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="tabular-nums"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>

        <div className="sm:col-span-3">
          <ColorPicker id={`${idPrefix}-color`} value={color} onChange={setColor} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "저장 중…" : isEdit ? "저장" : "추가"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
        ) : null}
      </div>
    </form>
  );
}
