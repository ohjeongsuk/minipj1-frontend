import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /*
     * 클라이언트 라우터 캐시 수명(초).
     *
     * Next.js 15 에서 기본값이 0 으로 바뀌어, Link 로 이동할 때마다
     * 방금 다녀온 페이지도 RSC 페이로드를 다시 받는다. 실측으로 이동 한 번에
     * TTFB 115~165ms 가 그대로 붙었다.
     *
     * 이 앱은 모든 page.tsx 가 "use client" 라(CLAUDE.md §9) RSC 페이로드에
     * 데이터가 들어 있지 않다. 3KB 짜리 컴포넌트 트리 껍데기뿐이고,
     * 실제 데이터는 React Query 가 자기 staleTime(30초)과 무효화 규칙으로
     * 따로 관리한다. 따라서 이 값을 켜도 낡은 데이터가 보일 경로가 없다.
     *
     * ⚠️ static 은 건드리지 않는다. 기본값 5분이면 충분하고,
     *    스키마상 30 이상만 허용되어 잘못 적으면 기동에 실패한다.
     */
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
