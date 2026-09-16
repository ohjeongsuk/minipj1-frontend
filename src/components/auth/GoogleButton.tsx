"use client";

import { Button } from "@/components/ui/button";

/**
 * 구글 로그인 시작 버튼 (AUTH-09).
 *
 * ⚠️ fetch 로 부르지 않는다. 구글 동의 화면으로 가는 리다이렉트 연쇄라
 *    브라우저가 주소창째 움직여야 한다. XHR 로 부르면 CORS 에서 막힌다.
 *
 * ⚠️ NextAuth/Auth.js 를 쓰지 않는다. 백엔드 주도 리다이렉트 방식이고
 *    토큰 발급 주체는 우리 서버다.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function GoogleButton({ label = "Google로 계속하기" }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = `${BASE_URL}/oauth2/authorization/google`;
      }}
    >
      {/* 구글 브랜드 마크. lucide 에는 없어서 공식 색상으로 직접 그린다 */}
      <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59A14.4 14.4 0 0 1 9.77 24c0-1.6.27-3.15.76-4.59l-7.98-6.19A23.96 23.96 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      {label}
    </Button>
  );
}
