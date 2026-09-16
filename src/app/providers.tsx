"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { createQueryClient } from "@/lib/queryClient";

/**
 * 전역 Provider 모음.
 *
 * QueryClient 를 useState 초기화 함수로 만드는 이유는,
 * 모듈 최상단에서 만들면 서버에서 모든 요청이 같은 인스턴스를 공유하게 되어
 * 사용자 간에 캐시가 새기 때문이다. 컴포넌트당 한 번만 만들어진다.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
