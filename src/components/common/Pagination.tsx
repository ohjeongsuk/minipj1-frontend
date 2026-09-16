"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 페이지네이션 공용 컴포넌트.
 * - 현재 페이지 주변 5개 + 처음/이전/다음/마지막
 * - 페이지 수가 1 이하면 렌더링하지 않는다
 * - 모바일은 "3 / 12" 형태로 축약한다
 *
 * page 는 0부터 시작한다(백엔드와 동일). 화면에는 +1 해서 보여준다.
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const WINDOW_SIZE = 5;

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const half = Math.floor(WINDOW_SIZE / 2);
  let start = Math.max(0, currentPage - half);
  const end = Math.min(totalPages - 1, start + WINDOW_SIZE - 1);
  // 끝에 닿았을 때도 창 크기를 유지한다
  start = Math.max(0, end - WINDOW_SIZE + 1);

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지 이동">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(0)}
        disabled={isFirst}
        aria-label="첫 페이지"
      >
        <ChevronsLeft className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>

      {/* 모바일: 축약 표시 */}
      <span className="px-3 text-caption tabular-nums text-muted-foreground sm:hidden">
        {currentPage + 1} / {totalPages}
      </span>

      {/* 데스크톱: 페이지 번호 */}
      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="icon"
            onClick={() => onPageChange(page)}
            aria-label={`${page + 1} 페이지`}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn("tabular-nums")}
          >
            {page + 1}
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        aria-label="다음 페이지"
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={isLast}
        aria-label="마지막 페이지"
      >
        <ChevronsRight className="size-4" aria-hidden />
      </Button>
    </nav>
  );
}
