"use client";

import { Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { safeColor } from "@/lib/color";
import { formatListDate } from "@/lib/date";
import { formatSignedAmount } from "@/lib/money";
import { HAIRLINE_ITEM } from "@/lib/utils";
import type { TransactionResponse } from "@/types/api";

/**
 * 거래 한 행.
 *
 * 행마다 카드를 두지 않고 1px 구분선으로만 나눈다. 목록은 스무 건이 이어지는 화면이라
 * 행마다 테두리를 두르면 테두리 스무 개가 내용보다 먼저 눈에 들어온다.
 * 카드 테두리는 목록 전체를 감싸는 <ul> 한 곳에만 있다 (TransactionList).
 *
 * 왼쪽은 무엇을 샀는지(거래처 → 카테고리), 오른쪽은 얼마·언제다.
 * 금액과 날짜를 같은 열에 세로로 쌓으면 tabular-nums 의 자릿수 정렬이 살아난다.
 *
 * ⚠️ 카테고리 색은 safeColor 로 #RRGGBB 를 확인하고 인라인 스타일에 넣는다.
 *    검증 없이 넣으면 CSS 값 주입 경로가 된다.
 *
 * ⚠️ 색 위에 글자를 올리지 않고 색 옆에 점으로 둔다.
 *    사용자가 지정한 색이라 대비를 계산할 수 없어 다크 모드에서 읽히지 않을 수 있다.
 *
 * ⚠️ prefers-reduced-motion 일 때도 motion.li 를 그대로 쓰고 지속 시간만 0 으로 만든다.
 *    조건부로 일반 li 와 바꾸면 컴포넌트가 재마운트되어 오히려 화면이 튄다.
 *
 * ⚠️ exit 에 borderTopWidth: 0 을 함께 넣는다. height 만 0 으로 줄이면
 *    사라진 행 자리에 구분선 1px 이 남아 목록에 빈 줄이 그어진 것처럼 보인다.
 */
interface TransactionRowProps {
  transaction: TransactionResponse;
  /** 등장 stagger 계산용 */
  index: number;
  onDelete: (id: number) => void;
}

const STAGGER_SECONDS = 0.03;

export function TransactionRow({ transaction, index, onDelete }: TransactionRowProps) {
  const { id, type, amount, txnDate, merchant, category } = transaction;
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : 0.18;

  return (
    <motion.li
      layout={!reduce}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, borderTopWidth: 0 }}
      transition={{ duration, delay: reduce ? 0 : index * STAGGER_SECONDS }}
      className={cn("flex items-center gap-2 overflow-hidden px-3 py-3", HAIRLINE_ITEM)}
    >
      {/* 삭제 버튼을 링크 안에 넣을 수 없으므로 본문만 링크로 감싼다 */}
      <Link
        href={`/transactions/${id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
        >
          <span
            className="size-3 rounded-full"
            style={{ background: safeColor(category.color, "#737373") }}
          />
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate text-item font-semibold",
              merchant ? undefined : "text-muted-foreground",
            )}
          >
            {merchant || "거래처 없음"}
          </span>
          <span className="truncate text-caption text-muted-foreground">
            {category.name}
            {category.deleted ? " (삭제됨)" : null}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end">
          <span
            className={cn(
              "text-item font-semibold tabular-nums",
              type === "INCOME" ? "text-income" : "text-expense",
            )}
          >
            {formatSignedAmount(amount, type)}
          </span>
          <span className="text-caption text-muted-foreground tabular-nums">
            {formatListDate(txnDate)}
          </span>
        </span>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`${merchant || category.name} 거래 삭제`}
        onClick={() => onDelete(id)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </motion.li>
  );
}
