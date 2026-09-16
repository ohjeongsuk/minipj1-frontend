"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "cn";

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

/** 접힌 상태에서 "몇 개가 걸려 있는지" 를 버튼에 보여주기 위한 개수 */
function countActive(filters: TransactionFilters): number {
  return Object.values(filters).filter((value) => value !== "").length;
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

  /*
   * 모바일에서만 접는다. sm 이상은 필터가 가로 한 줄이라 접을 이유가 없다.
   *
   * ⚠️ 접는 이유는 공간이다. 세로로 쌓이면 342px 를 먹어 목록이 첫 화면 밖으로 밀린다.
   *    이 화면의 본문은 목록이고 필터는 가끔 쓰는 도구다.
   *
   * ⚠️ 필터가 걸린 채로 접히면 "왜 목록이 이것뿐이지" 를 설명할 곳이 없어진다.
   *    그래서 버튼에 적용 개수를 띄우고, 필터가 있으면 처음부터 펼쳐 둔다.
   */
  const [open, setOpen] = useState(() => hasAnyFilter(filters));
  const activeCount = countActive(filters);

  // 필터 초기화처럼 밖에서 값이 바뀐 경우를 따라간다
  useEffect(() => {
    setKeyword(filters.keyword);
  }, [filters.keyword]);

  function patch(part: Partial<TransactionFilters>) {
    onChange({ ...filters, ...part });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 데스크톱에서는 필터가 한 줄이라 토글이 필요 없다 */}
      <Button
        type="button"
        variant="outline"
        className="justify-between sm:hidden"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden />
          필터
        </span>
        {activeCount > 0 ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-caption text-primary-foreground tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          patch({ keyword });
        }}
        className={cn(
          "gap-3 rounded-xl border border-border p-4 sm:grid sm:grid-cols-12",
          open ? "grid" : "hidden",
        )}
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
    </div>
  );
}
