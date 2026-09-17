"use client";

import { cn } from "cn";

import { BotAvatar, SuggestionChip } from "@/components/chat/ChatBits";

import { formatListDate } from "@/lib/date";
import { formatSignedAmount } from "@/lib/money";
import type { ChatBubble } from "@/lib/chatStorage";

/**
 * 말풍선 하나.
 *
 * ⚠️ TransactionRow 를 재사용하지 않는다. 그 컴포넌트는 onDelete 를 필수로 받고
 *    상세 링크를 감싸고 있어, 읽기 전용 세 줄을 위해 끌어오면 오히려 복잡해진다.
 *    챗봇에서 거래를 지우는 경로를 만들 이유도 없다.
 *
 * 답변 문장은 서버가 만든 것을 그대로 쓴다. 거래 목록의 금액만
 * 기존 formatSignedAmount 를 쓴다.
 */
interface ChatMessageProps {
  bubble: ChatBubble;
  onSuggestionClick: (text: string) => void;
}

export function ChatMessage({ bubble, onSuggestionClick }: ChatMessageProps) {
  const mine = bubble.role === "user";

  // 아바타는 위쪽에 맞춘다. items-end 로 두면 답변이 길어질수록 아이콘이
  // 마지막 줄 옆으로 내려가 누가 한 말인지가 첫 줄에서 읽히지 않는다.
  return (
    <li className={cn("flex items-start gap-2", mine ? "justify-end" : "justify-start")}>
      {/* 말하는 쪽을 색만으로 구분하지 않는다. 답변 옆에 아이콘을 두면
          말풍선이 길어져 색 대비가 약해져도 누가 한 말인지 바로 읽힌다 */}
      {mine ? null : <BotAvatar />}

      <div
        className={cn(
          "max-w-[85%] rounded-xl border px-3 py-2 text-item",
          mine ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
        )}
      >
        <p className="whitespace-pre-wrap">{bubble.content}</p>

        {/* 규칙 기반 파서는 오해할 수 있다. 어느 달로 읽었는지 밝힌다 */}
        {!mine && bubble.yearMonth ? (
          <p className="mt-1 text-caption text-muted-foreground">{bubble.yearMonth} 기준</p>
        ) : null}

        {bubble.transactions?.length ? (
          <ul className="mt-2 border-t border-border">
            {bubble.transactions.map((txn) => (
              <li
                key={txn.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate text-caption">
                  {txn.merchant || txn.category.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-caption font-semibold tabular-nums",
                    txn.type === "INCOME" ? "text-income" : "text-expense",
                  )}
                >
                  {formatSignedAmount(txn.amount, txn.type)}
                </span>
                <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
                  {formatListDate(txn.txnDate)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {bubble.suggestions?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {bubble.suggestions.map((text) => (
              <SuggestionChip key={text} text={text} onSelect={onSuggestionClick} />
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
