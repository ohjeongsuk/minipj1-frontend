"use client";

import { useMutation } from "@tanstack/react-query";

import { request } from "@/lib/apiClient";
import type { ChatResponse } from "@/types/api";

/**
 * 챗봇 질문.
 *
 * ⚠️ useQuery 가 아니라 useMutation 이다. 질문마다 새 요청이고 캐시할 대상이 아니다.
 *
 * ⚠️ 조회 전용이므로 invalidateQueries 를 부르지 않는다.
 *    데이터를 바꾸지 않으니 무효화할 캐시가 없다.
 */
export function useChat() {
  return useMutation({
    mutationFn: (variables: { message: string; asOf: string }) =>
      request<ChatResponse>("/api/v1/chat", { method: "POST", body: variables }),
  });
}
