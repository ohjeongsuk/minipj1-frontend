import type { Metadata } from "next";
import localFont from "next/font/local";

import { Providers } from "./providers";
import "./globals.css";

/*
 * Pretendard 는 Google Fonts 에 없으므로 next/font/google 로 불러올 수 없다.
 * 가변 폰트 파일 하나를 next/font/local 로 읽는다.
 * next/font 가 자체 호스팅하므로 외부 폰트 요청이 발생하지 않는다.
 */
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  variable: "--font-pretendard",
  display: "swap",
});

/*
 * 테마를 첫 페인트 전에 확정한다.
 *
 * 저장된 선택이 없으면 아무것도 하지 않는다 — 그 상태가 곧 "시스템 모드" 이고
 * globals.css 의 prefers-color-scheme 미디어쿼리가 CSS 만으로 처리한다.
 * 즉 대다수 사용자에게는 이 스크립트가 아무 일도 하지 않는다.
 *
 * ⚠️ useEffect 로 옮기면 hydration 이후에 실행돼 한 프레임 깜빡인다(FOUC).
 *    localStorage 는 서버가 읽을 수 없으므로 동기 인라인 스크립트가 유일한 방법이다.
 *
 * ⚠️ dangerouslySetInnerHTML 을 쓰지 않는다(CLAUDE.md 6장).
 *    React 19 는 <script> 의 문자열 자식을 스크립트 본문으로 렌더한다.
 *
 * ⚠️ try/catch 로 감싼다. 사생활 보호 모드에서는 localStorage 접근 자체가 던진다.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem("moneylog_theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export const metadata: Metadata = {
  title: "머니로그",
  description: "3초 안에 기록하고, 이번 달 지출을 예측하는 스마트 가계부",
};

/**
 * 루트 레이아웃만 서버 컴포넌트다.
 * 인증 토큰이 localStorage 에 있고 데이터를 React Query 로 가져오므로
 * 나머지 페이지는 사실상 전부 클라이언트 컴포넌트다.
 * Provider 는 별도 클라이언트 컴포넌트(Providers)로 분리해 감싼다.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script>{THEME_SCRIPT}</script>
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
