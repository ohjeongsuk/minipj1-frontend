"use client";

import { Bot } from "lucide-react";

/**
 * 챗봇 화면의 작은 조각들.
 *
 * ChatMessage 와 ChatPanel 이 같은 마크업을 각자 들고 있었다. 한쪽만 고치면
 * 말풍선 옆 아이콘과 로딩 중 아이콘이 서로 달라 보이므로 여기 한 곳에 둔다.
 * lib/utils.ts 의 HAIRLINE_LIST 와 같은 이유다.
 */

/** 답변 말풍선 옆에 붙는 아이콘. 말하는 쪽을 색만으로 구분하지 않기 위해 둔다 */
export function BotAvatar() {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted"
    >
      <Bot className="size-4 text-primary" />
    </span>
  );
}

/**
 * 눌러서 바로 보내는 예시 질문.
 *
 * 글로만 두면 무엇을 물어야 할지 모른다. 첫 진입의 환영 카드와
 * 못 알아들었을 때의 안내가 같은 모양을 써야 사용자가 같은 것으로 인식한다.
 */
export function SuggestionChip({
  text,
  onSelect,
}: {
  text: string;
  onSelect: (text: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(text)}
      className="rounded-lg border border-border px-2 py-1 text-caption hover:bg-muted"
    >
      {text}
    </button>
  );
}
