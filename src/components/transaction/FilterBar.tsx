"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryResponse } from "@/types/api";

/** URL 쿼리와 1:1 로 대응한다. 빈 문자열은 "미지정"이다 */
export interface TransactionFilters {
  from: string;
  to: string;
  type: string;
  categoryId: string;
  keyword: string;
}

export const EMPTY_FILTERS: TransactionFilters = {
  from: "",
  to: "",
  type: "",
  categoryId: "",
  keyword: "",
};

export function hasAnyFilter(filters: TransactionFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface FilterBarProps {
  filters: TransactionFilters;
  categories: CategoryResponse[];
  onChange: (next: TransactionFilters) => void;
}

export function FilterBar({ filters, categories, onChange }: FilterBarProps) {
  /*
   * 키워드만 로컬 상태로 따로 든다.
   * 매 글자마다 URL 을 갱신하면 히스토리가 글자 수만큼 쌓여 뒤로가기가 망가진다.
   * 제출(Enter 또는 검색 버튼) 시점에만 URL 로 올린다.
   */
  const [keyword, setKeyword] = useState(filters.keyword);

  // 필터 초기화처럼 밖에서 값이 바뀐 경우를 따라간다
  useEffect(() => {
    setKeyword(filters.keyword);
  }, [filters.keyword]);

  function patch(part: Partial<TransactionFilters>) {
    onChange({ ...filters, ...part });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        patch({ keyword });
      }}
      className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-12"
    >
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="filter-from">시작일</Label>
        <Input
          id="filter-from"
          type="date"
          value={filters.from}
          onChange={(e) => patch({ from: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="filter-to">종료일</Label>
        <Input
          id="filter-to"
          type="date"
          value={filters.to}
          onChange={(e) => patch({ to: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="filter-type">구분</Label>
        <select
          id="filter-type"
          className={SELECT_CLASS}
          value={filters.type}
          onChange={(e) => patch({ type: e.target.value })}
        >
          <option value="">전체</option>
          <option value="EXPENSE">지출</option>
          <option value="INCOME">수입</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="filter-category">카테고리</Label>
        <select
          id="filter-category"
          className={SELECT_CLASS}
          value={filters.categoryId}
          onChange={(e) => patch({ categoryId: e.target.value })}
        >
          <option value="">전체</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-4">
        <Label htmlFor="filter-keyword">검색</Label>
        <div className="flex items-center gap-2">
          <Input
            id="filter-keyword"
            type="search"
            placeholder="거래처 · 메모"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="submit" variant="outline" size="icon" aria-label="검색">
            <Search className="size-4" aria-hidden />
          </Button>
          {hasAnyFilter(filters) ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="필터 초기화"
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              <X className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
