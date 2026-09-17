"use client";

import { Bot, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

import { ChatMessage } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/useChat";
import { clearChat, readChat, writeChat, type ChatBubble } from "@/lib/chatStorage";
import { today } from "@/lib/date";

/**
 * 대화 영역. 페이지(/chat)와 플로팅 위젯이 함께 쓴다.
 *
 * ⚠️ 높이는 부모가 정한다. 여기서는 flex-1 + min-h-0 으로 목록만 스크롤시킨다.
 *    min-h-0 이 없으면 flex 자식의 기본 min-height:auto 때문에 목록이 줄지 않고
 *    부모를 밀어내, 떠 있는 창에서 입력칸이 화면 밖으로 나간다.
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
  className?: string;
  /** 위젯이 열릴 때 입력칸에 바로 커서를 두기 위해 쓴다 */
  autoFocus?: boolean;
}

export function ChatPanel({ userId, className, autoFocus = false }: ChatPanelProps) {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [draft, setDraft] = useState("");
  const chat = useChat();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 마운트 이후에 이력을 복원한다
  useEffect(() => {
    setBubbles(readChat(userId));
  }, [userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [bubbles, chat.isPending]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

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

  const reset = () => {
    setBubbles([]);
    clearChat(userId);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {bubbles.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-item font-semibold">
              <Bot className="size-4 text-primary" aria-hidden />
              무엇이든 물어보세요
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              금액·카테고리·내역·예산을 찾아드려요. 기록을 바꾸지는 않아요.
            </p>
            {/* 글로만 두면 무엇을 물어야 할지 모른다. 눌러서 바로 보낼 수 있게 한다 */}
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

        {chat.isPending ? <TypingIndicator /> : null}

        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-2">
        {bubbles.length > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3" aria-hidden />
            대화 지우기
          </button>
        ) : null}

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <Input
            ref={inputRef}
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
    </div>
  );
}

/**
 * 답을 기다리는 동안의 점 세 개.
 *
 * prefers-reduced-motion 은 globals.css 가 전역으로 지속시간을 0.01ms 로 줄이므로
 * 여기서 따로 분기하지 않는다. 움직임이 멈춰도 점은 그대로 보인다.
 */
function TypingIndicator() {
  return (
    <div className="mt-3 flex items-start gap-2" aria-live="polite">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted"
      >
        <Bot className="size-4 text-primary" />
      </span>
      <span className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-3">
        <span className="sr-only">답을 찾는 중이에요</span>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
