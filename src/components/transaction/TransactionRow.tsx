"use client";

import { Trash2 } from "lucide-react";
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
 */
interface TransactionRowProps {
  transaction: TransactionResponse;
  onDelete: (id: number) => void;
}

export function TransactionRow({ transaction, onDelete }: TransactionRowProps) {
  const { id, type, amount, txnDate, merchant, category } = transaction;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
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
          {category.deleted ? (
            <span className="text-muted-foreground">(삭제됨)</span>
          ) : null}
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
    </li>
  );
}
