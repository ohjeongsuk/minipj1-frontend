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
    <html lang="ko" className={pretendard.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
