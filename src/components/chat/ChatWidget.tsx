"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";

/**
 * 어느 화면에서나 떠 있는 챗봇 창.
 *
 * 대시보드를 보면서 물어보는 것이 이 기능의 쓸모다. 페이지로만 두면
 * 숫자를 확인하러 나갔다 와야 하므로, 화면 위에 얹는다.
 *
 * ⚠️ 대화 UI 는 ChatPanel 을 그대로 재사용한다. 껍데기(버튼·헤더·크기)만 여기 있다.
 *    두 벌로 만들면 답변 렌더링이 갈라진다.
 *
 * ⚠️ 모바일 FAB 는 bottom-20 이다. 하단 탭 바가 64px 이라 bottom-6 으로 두면
 *    "예산" 탭 위에 얹힌다.
 *
 * ⚠️ 그림자는 shadow-md 를 쓴다. §8 이 "그림자는 모달·드롭다운에만" 을 허용하고
 *    popover·select 가 이미 같은 값을 쓴다. --hero-shadow 는 잔액 카드 전용이며
 *    다크에서 none 이라 떠 있는 창에는 맞지 않는다.
 *
 * ⚠️ 등장 애니메이션에 motion 을 쓰지 않는다. 이 컴포넌트는 (main) 레이아웃에 있어
 *    모든 화면이 함께 내려받는데, motion 청크가 43KB 다. 실제로 애니메이션이 필요한 곳은
 *    거래 목록(/transactions) 뿐이라 나머지 다섯 화면이 쓰지도 않을 라이브러리를 받게 된다.
 *    tw-animate-css 는 이미 globals.css 에 import 되어 있고 dialog 가 같은 유틸리티를 쓴다.
 *    대신 닫힘 애니메이션은 없다 — 사라지는 쪽은 눈이 좇지 않으므로 잃는 것이 거의 없다.
 *
 * ⚠️ prefers-reduced-motion 은 globals.css 가 전역으로 지속시간을 0.01ms 로 줄이므로
 *    여기서 따로 분기하지 않는다.
 */
interface ChatWidgetProps {
  userId: number;
}

export function ChatWidget({ userId }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const fabRef = useRef<HTMLButtonElement>(null);

  // Esc 로 닫는다. 떠 있는 창의 기본 동작이다
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus(); // 닫으면 포커스를 버튼으로 되돌린다
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // /chat 은 같은 대화를 전체 화면으로 보여준다. 한 화면에 입구가 둘일 이유가 없다
  if (pathname === "/chat") {
    return null;
  }

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="잔고 도우미"
          className="animate-in fade-in-0 slide-in-from-bottom-2 fixed inset-x-4 top-20 bottom-36 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-md duration-150 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-24 sm:h-[560px] sm:w-[380px]"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-full bg-primary"
              >
                <MessageCircle className="size-4 text-primary-foreground" />
              </span>
              <div>
                <p className="text-item font-semibold leading-tight">
                  잔고 도우미
                </p>
                <p className="text-caption leading-tight text-muted-foreground">
                  조회 전용
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                fabRef.current?.focus();
              }}
              aria-label="닫기"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <ChatPanel userId={userId} autoFocus className="flex-1 p-4" />
        </div>
      ) : null}

      {/*
        배지(빨간 «1»)를 달지 않는다. 이 앱에는 "안 읽음" 개념이 없어
        항상 켜두면 거짓말이고, 끄면 장식만 남는다.

        색은 액센트(#4F46E5)다. 레퍼런스는 주황·빨강이지만 #EF4444 는
        이 앱에서 "지출" 전용 색이라 버튼에 쓰면 금액 색 체계가 무너진다.
      */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "챗봇 닫기" : "챗봇 열기"}
        className="fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:right-6 sm:bottom-6"
      >
        {open ? (
          <X className="size-6" aria-hidden />
        ) : (
          <MessageCircle className="size-6" aria-hidden />
        )}
      </button>
    </>
  );
}
