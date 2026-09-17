"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessage } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/useChat";
import { readChat, writeChat, type ChatBubble } from "@/lib/chatStorage";
import { today } from "@/lib/date";

/**
 * 대화 화면.
 *
 * ⚠️ 첫 렌더에서 localStorage 를 읽지 않는다. 서버 HTML 에는 이력이 없으므로
 *    렌더 시점에 읽으면 hydration 이 어긋난다. 마운트 이후에 넣는다.
 *
 * ⚠️ asOf 는 lib/date.ts 의 today() 로 만든다. 화면에서 date-fns 의 format 을
 *    직접 부르지 않는 것이 규칙이고, toISOString 은 UTC 로 변환되어
 *    날짜가 하루 어긋난다.
 */
const WELCOME = ["이번달 얼마 썼어?", "지난달 식비 얼마 썼어?", "최근 지출 보여줘"];

interface ChatPanelProps {
  userId: number;
}

export function ChatPanel({ userId }: ChatPanelProps) {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [draft, setDraft] = useState("");
  const chat = useChat();
  const endRef = useRef<HTMLDivElement>(null);

  // 마운트 이후에 이력을 복원한다
  useEffect(() => {
    setBubbles(readChat(userId));
  }, [userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [bubbles]);

  const send = (text: string) => {
    const message = text.trim();
    if (!message || chat.isPending) {
      return;
    }
    const asked: ChatBubble = { id: `u${Date.now()}`, role: "user", content: message };
    const next = [...bubbles, asked];
    setBubbles(next);
    setDraft("");

    const append = (bubble: ChatBubble) => {
      const merged = [...next, bubble];
      setBubbles(merged);
      writeChat(userId, merged);
    };

    chat.mutate(
      { message, asOf: today() },
      {
        onSuccess: (data) =>
          append({
            id: `b${Date.now()}`,
            role: "bot",
            content: data.answer,
            yearMonth: data.yearMonth,
            transactions: data.transactions,
            suggestions: data.suggestions,
          }),
        // 401 은 apiClient 가 이미 로그아웃으로 처리한다. 여기 오는 건 그 밖의 실패다
        onError: () =>
          append({
            id: `e${Date.now()}`,
            role: "bot",
            content: "답을 가져오지 못했어요. 잠시 후 다시 물어봐 주세요.",
          }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {bubbles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-item font-semibold">무엇이든 물어보세요</p>
          <p className="mt-1 text-caption text-muted-foreground">
            금액·카테고리·내역·예산을 찾아드려요. 기록을 바꾸지는 않아요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {WELCOME.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => send(text)}
                className="rounded-lg border border-border px-2 py-1 text-caption hover:bg-muted"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {bubbles.map((bubble) => (
            <ChatMessage key={bubble.id} bubble={bubble} onSuggestionClick={send} />
          ))}
        </ul>
      )}

      {chat.isPending ? (
        <p className="text-caption text-muted-foreground" aria-live="polite">
          찾아보는 중이에요…
        </p>
      ) : null}

      <div ref={endRef} />

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="이번달 얼마 썼어?"
          maxLength={200}
          disabled={chat.isPending}
          aria-label="질문 입력"
        />
        <Button type="submit" disabled={chat.isPending || !draft.trim()}>
          <Send className="size-4" aria-hidden />
          <span className="sr-only">보내기</span>
        </Button>
      </form>
    </div>
  );
}
