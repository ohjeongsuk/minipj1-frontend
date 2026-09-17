"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/common/Logo";
import { getToken, isTokenExpired } from "@/lib/apiClient";

/**
 * 로그인·회원가입 공통 레이아웃.
 *
 * 이미 유효한 토큰이 있으면 로그인 폼을 보여줄 이유가 없으므로 대시보드로 보낸다.
 * useAuth 를 쓰지 않는 이유는 그 훅이 /auth/me 를 함께 부르기 때문이다 —
 * 어차피 즉시 떠날 화면에서 요청을 한 번 더 낼 필요가 없다.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  // 판정 전에는 폼을 그리지 않는다. 로그인된 사용자에게 로그인 폼이 깜빡이지 않게 한다
  if (!ready) {
    return null;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 flex items-center justify-center gap-2 text-2xl font-semibold">
          <Logo size={34} />
          잔고 <span className="text-muted-foreground">Zango</span>
        </h1>
        <p className="mb-8 text-center text-caption text-muted-foreground">
          3초 안에 기록하고, 이번 달 지출을 예측합니다
        </p>
        {children}
      </div>
    </div>
  );
}
