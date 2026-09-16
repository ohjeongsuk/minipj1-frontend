"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CardSkeleton } from "@/components/common/ListSkeleton";
import { setToken } from "@/lib/apiClient";
import { resolveError } from "@/lib/errorMessages";

/**
 * 구글 로그인 콜백 (AUTH-09).
 *
 * 백엔드가 #token=... 또는 #error=... 를 붙여 여기로 보낸다.
 *
 * ⚠️ 쿼리스트링이 아니라 프래그먼트를 쓰는 이유는 프래그먼트가 서버로 전송되지 않기 때문이다.
 *    액세스 로그와 Referer 헤더에 JWT 가 남지 않는다.
 *
 * ⚠️ 값을 읽는 즉시 history.replaceState 로 해시를 지운다.
 *    안 지우면 주소창에 토큰이 그대로 남고 뒤로가기로 다시 드러난다.
 *
 * ⚠️ useSearchParams 를 쓰지 않으므로 Suspense 가 필요 없다.
 *    해시는 서버가 알 수 없어 애초에 클라이언트에서만 읽힌다.
 *
 * ⚠️ 이 이펙트는 자기 입력을 소비하고 지운다(replaceState). 그래서 멱등하지 않다.
 *    React 19 의 StrictMode 는 개발 모드에서 이펙트를 두 번 실행하는데,
 *    2회차에는 해시가 이미 비어 있어 "토큰이 없다 = 실패"로 단정하고
 *    1회차의 성공을 덮어쓴다. 토큰은 저장됐는데 실패 문구가 뜨는 모순이 생긴다.
 *    프로덕션 빌드에서는 한 번만 실행돼 증상이 사라지므로 개발에서만 깨진다.
 *    ref 로 본문을 1회로 묶어 Fast Refresh 재실행에도 견디게 한다.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    const errorCode = params.get("error");

    // 읽자마자 지운다. 이후 분기에서 무엇을 하든 주소창에는 남지 않는다
    window.history.replaceState(null, "", window.location.pathname);

    if (token) {
      setToken(token);
      router.replace("/dashboard");
      return;
    }

    setErrorMessage(
      resolveError({ code: errorCode ?? "OAUTH2_FAILED", message: "" }).message,
    );
  }, [router]);

  if (!errorMessage) {
    return (
      <div aria-busy="true" aria-label="로그인 처리 중">
        <CardSkeleton cards={1} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p
        role="alert"
        className="rounded-lg border border-destructive/40 px-3 py-2 text-caption text-destructive"
      >
        {errorMessage}
      </p>
      <a
        href="/login"
        className="text-center text-caption font-medium text-foreground underline underline-offset-4"
      >
        로그인 화면으로 돌아가기
      </a>
    </div>
  );
}
