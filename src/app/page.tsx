import { redirect } from "next/navigation";

/**
 * 루트는 대시보드로 보낸다.
 * 미인증이면 (main) 레이아웃의 라우트 보호가 다시 /login 으로 보내므로
 * 여기서 토큰을 볼 필요가 없다 — 서버에는 localStorage 가 없기도 하다.
 */
export default function Home() {
  redirect("/dashboard");
}
