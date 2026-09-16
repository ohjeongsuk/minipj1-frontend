"use client";

import { Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { safeColor } from "@/lib/color";
import { formatListDate } from "@/lib/date";
import { formatSignedAmount } from "@/lib/money";
import type { TransactionResponse } from "@/types/api";

/**
 * 거래 한 행.
 *
 * ⚠️ 카테고리 색은 safeColor 로 #RRGGBB 를 확인하고 인라인 스타일에 넣는다.
 *    검증 없이 넣으면 CSS 값 주입 경로가 된다.
 *
 * ⚠️ 색 위에 글자를 올리지 않고 색 옆에 점으로 둔다.
 *    사용자가 지정한 색이라 대비를 계산할 수 없어 다크 모드에서 읽히지 않을 수 있다.
 *
 * ⚠️ prefers-reduced-motion 일 때도 motion.li 를 그대로 쓰고 지속 시간만 0 으로 만든다.
 *    조건부로 일반 li 와 바꾸면 컴포넌트가 재마운트되어 오히려 화면이 튄다.
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
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration, delay: reduce ? 0 : index * STAGGER_SECONDS }}
      className="flex items-center gap-3 overflow-hidden rounded-xl border border-border p-3"
    >
      {/* 삭제 버튼을 링크 안에 넣을 수 없으므로 본문만 링크로 감싼다 */}
      <Link
        href={`/transactions/${id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="w-24 shrink-0 text-caption text-muted-foreground tabular-nums">
          {formatListDate(txnDate)}
        </span>

        <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2 py-0.5 text-caption">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ background: safeColor(category.color, "#737373") }}
          />
          {category.name}
          {category.deleted ? <span className="text-muted-foreground">(삭제됨)</span> : null}
        </span>

        <span className="truncate text-body">{merchant || "—"}</span>
      </Link>

      <span
        className={cn(
          "shrink-0 text-item font-semibold tabular-nums",
          type === "INCOME" ? "text-income" : "text-expense",
        )}
      >
        {formatSignedAmount(amount, type)}
      </span>

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
