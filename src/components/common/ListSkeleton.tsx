import { Skeleton } from "@/components/ui/skeleton";
import { HAIRLINE_ITEM, HAIRLINE_LIST, SECTION_CARD } from "@/lib/utils";

/**
 * 로딩 표시는 스피너 대신 스켈레톤을 쓴다.
 * 목록은 항목형 5개, 대시보드는 카드형이 기본이다.
 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={HAIRLINE_LIST} aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={`flex items-center gap-3 p-3 ${HAIRLINE_ITEM}`}>
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className={SECTION_CARD}>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
  );
}
