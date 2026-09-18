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
 * ⚠️ FAB 는 bottom-20 이다. 하단 탭 바가 64px 이라 bottom-6 으로 두면
 *    "예산" 탭 위에 얹힌다.
 *
 * ⚠️ 전환점을 md 로 둔다. 하단 탭 바가 md 까지 떠 있으므로(AppHeader 참조)
 *    sm 으로 두면 640~767px 에서 버튼이 탭 바 위로 내려앉는다.
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

/** size-14 와 같은 값. 화면 안에 가두는 계산에 쓴다 */
const FAB_SIZE = 56;
/** 화면 가장자리에서 이만큼은 떨어뜨린다 */
const EDGE = 8;
/**
 * 이 거리 아래로 움직였으면 드래그가 아니라 탭으로 본다.
 *
 * ⚠️ 0 으로 두면 안 된다. 손가락은 누르는 동안 1~3px 씩 흔들려서,
 *    임계값이 없으면 모든 탭이 드래그로 잡혀 챗봇이 열리지 않는다.
 */
const DRAG_THRESHOLD = 5;

interface Pos {
  x: number;
  y: number;
}

/** 버튼이 화면 밖으로 나가지 않게 가둔다 */
function clampToViewport({ x, y }: Pos): Pos {
  const maxX = Math.max(EDGE, window.innerWidth - FAB_SIZE - EDGE);
  const maxY = Math.max(EDGE, window.innerHeight - FAB_SIZE - EDGE);
  return {
    x: Math.min(Math.max(x, EDGE), maxX),
    y: Math.min(Math.max(y, EDGE), maxY),
  };
}

export function ChatWidget({ userId }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const fabRef = useRef<HTMLButtonElement>(null);

  /*
   * 버튼 위치. null 이면 CSS 기본 자리(오른쪽 아래)를 쓴다.
   * 사용자가 한 번 옮긴 뒤에야 좌표가 생기고, 그때부터 인라인 style 이 이긴다.
   *
   * ⚠️ 위치를 저장하지 않는다. 새로고침하면 늘 기본 자리로 돌아온다.
   *    테마(moneylog_theme)·그래프 종류(moneylog_chart)와 다른 판단인데,
   *    그 둘은 "어떻게 볼지" 라는 취향이고 화면 어디서나 뜻이 같은 반면,
   *    버튼 위치는 그 순간 가린 것을 잠깐 치우는 동작에 가깝기 때문이다.
   *    치운 자리가 다음 화면에서는 오히려 방해가 될 수 있고, 그때 사용자는
   *    자기가 언제 옮겼는지 기억하지 못한 채 "버튼이 왜 여기 있지" 를 겪는다.
   *    기본 자리가 늘 예측 가능한 편이 낫다.
   */
  const [pos, setPos] = useState<Pos | null>(null);
  /* setPos 는 비동기라 드래그가 끝나는 시점에 최신 좌표를 읽으려면 거울이 필요하다 */
  const posRef = useRef<Pos | null>(null);
  /* 드래그 중 상태: 버튼 안에서 잡은 지점과, 임계값을 넘었는지 */
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  /* 드래그 직후 따라오는 click 을 한 번 삼킨다 */
  const skipClickRef = useRef(false);

  const place = (next: Pos) => {
    posRef.current = next;
    setPos(next);
  };

  /*
   * ⚠️ 창이 작아지면 저장된 좌표가 화면 밖일 수 있다. 그대로 두면 버튼이
   *    보이지 않는 곳에 남아 챗봇을 열 방법이 사라진다. 리사이즈마다 다시 가둔다.
   */
  useEffect(() => {
    const onResize = () => {
      if (posRef.current) {
        place(clampToViewport(posRef.current));
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  /*
   * 드래그. Pointer Events 하나로 마우스·터치·펜을 같은 코드가 처리한다.
   * mousedown/touchstart 두 벌을 두면 두 경로가 갈라지고, 터치 쪽만 조용히 깨진다.
   *
   * ⚠️ setPointerCapture 가 핵심이다. 이게 없으면 포인터가 버튼 밖으로
   *    빠져나가는 순간 move 이벤트가 끊겨 버튼이 손가락을 놓친다.
   */
  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      moved: false,
    };
    skipClickRef.current = false; // 지난번 드래그의 흔적이 남지 않게 매번 초기화한다
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const next = clampToViewport({
      x: event.clientX - drag.dx,
      y: event.clientY - drag.dy,
    });
    if (!drag.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (Math.hypot(next.x - rect.left, next.y - rect.top) < DRAG_THRESHOLD) {
        return;
      }
      drag.moved = true;
    }
    place(next);
  }

  function handlePointerEnd() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved) {
      return; // 움직이지 않았으면 평범한 탭이다. click 이 챗봇을 연다
    }
    skipClickRef.current = true; // 드래그가 만든 click 하나를 삼킨다
  }

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
          className="animate-in fade-in-0 slide-in-from-bottom-2 fixed inset-x-4 top-20 bottom-36 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-md duration-150 md:inset-x-auto md:top-auto md:right-6 md:bottom-24 md:h-[560px] md:w-[380px]"
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
      {/*
        끌어서 옮길 수 있다. 화면 오른쪽 아래는 저장 버튼이나 목록 끝과 자주 겹치는
        자리라, 가리면 사용자가 치울 수 있어야 한다.

        ⚠️ touch-none(touch-action: none) 이 없으면 터치로 끌 때 브라우저가
           페이지 스크롤로 해석해 버튼이 따라오지 않는다.

        ⚠️ pos 가 있을 때 right·bottom 을 auto 로 덮는다. 그러지 않으면
           클래스의 right-4/bottom-20 과 인라인 left/top 이 동시에 걸려
           버튼이 늘어난다.

        ⚠️ 키보드로는 옮길 수 없다. 대신 기본 자리가 늘 유효하고, Enter·Space 로
           여는 경로는 그대로다. 위치는 취향이지 기능이 아니라 이 정도로 둔다.
      */}
      <button
        ref={fabRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={() => {
          if (skipClickRef.current) {
            skipClickRef.current = false; // 방금 끝난 드래그가 만든 click 이다
            return;
          }
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-label={open ? "챗봇 닫기" : "챗봇 열기"}
        style={
          pos
            ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
            : undefined
        }
        className="fixed right-4 bottom-20 z-50 flex size-14 touch-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform select-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:right-6 md:bottom-6"
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
