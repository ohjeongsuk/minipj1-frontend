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
      {/* 모바일은 하단 탭 바에 가리지 않도록 아래 여백을 크게 준다 */}
      {/* 하단 탭 바가 md 까지 떠 있으므로 본문 아래 여백도 md 에서 푼다 */}
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-24 sm:px-6 md:pb-10">{children}</main>
      {/* 본문 양옆 여백. 1400px 미만에서는 자리가 없어 렌더하지 않는다 */}
      <AdSlot side="left" />
      <AdSlot side="right" />
      {/* 어느 화면에서나 떠 있다. me 가 아직 없으면 이력 키를 만들 수 없으므로 기다린다 */}
      {me ? <ChatWidget userId={me.id} /> : null}
    </div>
  );
}
