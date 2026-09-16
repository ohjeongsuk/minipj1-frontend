"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  clearToken,
  getToken,
  isTokenExpired,
  request,
  setToken,
} from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { MeResponse, TokenResponse } from "@/types/api";

/**
 * 인증 판정 · 내 정보 · 로그아웃.
 *
 * ⚠️ 판정은 "localStorage 에 토큰 문자열이 있는가"가 아니라 exp 디코드로 한다.
 *    만료 토큰이 판정을 통과하면 보호 레이아웃이 인증으로 보고 화면을 그린 뒤
 *    API 가 401 을 주는 왕복 동안 보호된 화면이 노출된다.
 */
export type AuthStatus = "checking" | "authed" | "anon";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /*
   * localStorage 를 렌더 중에 읽지 않는다.
   * 서버 렌더 시점에는 존재하지 않아 hydration 이 어긋난다.
   * 그래서 첫 프레임은 반드시 checking 이고, 그동안 보호 화면을 마운트하지 않는다.
   */
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      clearToken(); // 만료로 판정되면 즉시 폐기한다
      setStatus("anon");
      return;
    }
    setStatus("authed");
  }, []);

  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => request<MeResponse>("/api/v1/auth/me"),
    enabled: status === "authed",
    staleTime: Infinity, // 닉네임은 이 세션 동안 바뀌지 않는다
  });

  /** 서버 API 를 호출하지 않는다. 토큰 삭제 + 캐시 초기화가 전부다 (AUTH-06) */
  const logout = useCallback(() => {
    clearToken();
    setStatus("anon"); // me 쿼리를 먼저 끈다. 안 그러면 캐시를 비우자마자 다시 받아온다
    queryClient.clear();
    // replace 라서 히스토리에 보호 경로가 남지 않는다
    router.replace("/login");
  }, [queryClient, router]);

  return { status, me: meQuery.data ?? null, logout };
}

interface Credentials {
  email: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (body: Credentials) =>
      request<TokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body,
        skipAuth: true,
      }),
    onSuccess: (token) => setToken(token.accessToken),
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (body: Credentials & { nickname: string }) => {
      /*
       * 백엔드의 POST /auth/signup 은 토큰이 아니라 MeResponse 를 반환한다.
       * 가입 직후 자동 로그인(AUTH-01 → AUTH-04)을 위해
       * 같은 자격증명으로 login 을 한 번 더 호출해 토큰을 받는다.
       * API 계약을 바꾸지 않기 위한 선택이며, 로컬에서는 두 요청 합쳐 수십 ms 다.
       */
      await request<MeResponse>("/api/v1/auth/signup", {
        method: "POST",
        body,
        skipAuth: true,
      });
      const token = await request<TokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email: body.email, password: body.password },
        skipAuth: true,
      });
      setToken(token.accessToken);
    },
  });
}
