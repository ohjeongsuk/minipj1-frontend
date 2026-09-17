"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ChatWidget } from "@/components/chat/ChatWidget";
import { AdSlot } from "@/components/common/AdSlot";
import { AppHeader } from "@/components/common/AppHeader";
import { CardSkeleton } from "@/components/common/ListSkeleton";
import { useAuth } from "@/hooks/useAuth";

/**
 * 보호 경로 레이아웃 (AUTH-07).
 *
 * ⚠️ middleware.ts 를 만들지 않는다.
 *    토큰이 localStorage 에 있어 서버에서 읽을 수 없다. middleware 는 쿠키만 본다.
 *
 * ⚠️ 판정이 끝나기 전에는 children 을 마운트조차 하지 않는다.
 *    조건부 className 이나 opacity 로 가리면 보호 화면의 컴포넌트가 실행되고
 *    그 안의 API 호출까지 나간다. 아예 렌더 트리에 넣지 않는 것이 유일한 방어다.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { status, me, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anon") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authed") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <AppHeader nickname={me?.nickname ?? ""} onLogout={logout} />
      {/*
        아래 여백은 하단 탭 바가 아니라 챗봇 FAB 를 기준으로 잡는다.

        ⚠️ 예전 값 pb-24(96px) 는 탭 바 64px 만 피하려던 값이었다. 그런데 FAB 가
           bottom-20(80px) + size-14(56px) 라 바닥에서 136px 까지 올라온다.
           그래서 페이지 맨 아래 오른쪽에 버튼이 있으면 FAB 가 그 위에 얹혀
           클릭 자체가 FAB 로 들어갔다 — 예산 화면의 "저장" 이 실제로 안 눌렸다.
           390x667 에서 저장 버튼(539~571)과 FAB(531~587)가 겹치는 것을 확인했다.

        ⚠️ 이건 예산 화면만의 문제가 아니다. 오른쪽 아래에 동작을 두는 화면이면
           전부 같은 증상이 나므로 공통 레이아웃에서 막는다.

        모바일 pb-40(160px) = FAB 상단 136px + 여유 24px
        md    pb-24(96px)  = FAB 가 bottom-6 으로 내려와 상단이 80px + 여유 16px
      */}
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-40 sm:px-6 md:pb-24">{children}</main>
      {/* 본문 양옆 여백. 1400px 미만에서는 자리가 없어 렌더하지 않는다 */}
      <AdSlot side="left" />
      <AdSlot side="right" />
      {/* 어느 화면에서나 떠 있다. me 가 아직 없으면 이력 키를 만들 수 없으므로 기다린다 */}
      {me ? <ChatWidget userId={me.id} /> : null}
    </div>
  );
}
