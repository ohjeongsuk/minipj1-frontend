import { QueryClient } from "@tanstack/react-query";

import { ApiRequestError } from "./apiClient";

/**
 * QueryClient 생성. Providers 에서 컴포넌트당 한 번만 만든다.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 로컬 API 는 수십 ms 라 과한 재시도가 필요 없다.
        // 4xx 는 다시 보내도 같은 결과이므로 재시도하지 않는다.
        retry: (failureCount, error) => {
          if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
