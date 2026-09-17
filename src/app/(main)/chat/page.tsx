"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { CardSkeleton } from "@/components/common/ListSkeleton";
import { useAuth } from "@/hooks/useAuth";

/**
 * 조회 전용 챗봇 화면.
 *
 * ⚠️ 인증 판정은 (main) 레이아웃이 이미 끝냈다. 여기서 다시 검사하지 않는다.
 *    다만 /auth/me 응답이 아직 도착하지 않았을 수 있어 me 가 잠깐 null 이다.
 *    userId 로 이력을 읽어야 하므로 그동안은 스켈레톤을 보여준다.
 */
export default function ChatPage() {
  const { me } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">챗봇</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          기록을 찾아드려요. 추가하거나 지우지는 않아요.
        </p>
      </div>
      {me ? <ChatPanel userId={me.id} /> : <CardSkeleton />}
    </div>
  );
}
