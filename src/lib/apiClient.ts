import { clearAllChats } from "@/lib/chatStorage";
import type { ApiError, ApiResponse } from "@/types/api";

/**
 * 모든 API 호출이 지나는 한 곳.
 * 토큰 주입 · ApiResponse 언래핑 · 401 자동 로그아웃을 담당한다.
 * 컴포넌트 안에서 fetch 를 직접 호출하지 않는다.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** localStorage 키. 다른 곳에서 문자열을 직접 쓰지 않는다 */
export const TOKEN_KEY = "moneylog_access_token";

/** 서버가 준 error 를 그대로 들고 다니는 예외. 화면은 code 로 분기한다 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly error: ApiError | null;

  constructor(status: number, error: ApiError | null) {
    super(error?.message ?? "요청에 실패했습니다.");
    this.name = "ApiRequestError";
    this.status = status;
    this.error = error;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    // 로그아웃 경로가 둘이다 — 사용자가 누르는 useAuth.logout 과 401 에서 도는
    // forceLogout. 둘 다 이 함수를 지나므로 여기서 한 번만 지운다.
    // 호출부마다 넣으면 나중에 세 번째 경로가 생겼을 때 조용히 빠지고,
    // 그 실패는 "다음 사용자가 남의 가계부 질문을 본다" 는 형태로 나타난다.
    clearAllChats();
  }
}

/**
 * 토큰 만료 판정.
 *
 * ⚠️ "localStorage 에 토큰 문자열이 있는가"만 검사하면 만료된 토큰이 판정을 통과한다.
 *    그러면 보호 레이아웃이 인증으로 판정 → 화면 렌더 → API 호출 → 401 →
 *    자동 로그아웃 → /login 이 되어, 그 왕복 동안 보호된 화면이 노출된다.
 *
 * 서명 검증은 서버가 한다. 프론트는 exp 만 읽으면 되므로 라이브러리가 필요 없다.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true; // 형식이 깨진 토큰도 만료로 취급한다
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** multipart 업로드용. body 대신 이걸 주면 Content-Type 을 브라우저가 정한다 */
  formData?: FormData;
  /** 인증이 필요 없는 경로(signup·login)에서 true */
  skipAuth?: boolean;
  searchParams?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, searchParams?: RequestOptions["searchParams"]): string {
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/** 401 을 받으면 토큰을 지우고 로그인으로 보낸다 */
function forceLogout(): void {
  clearToken();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

/**
 * ApiResponse 봉투를 벗겨 data 만 돌려준다.
 * 실패면 ApiRequestError 를 던지므로 호출부는 성공 경로만 쓰면 된다.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, skipAuth = false, searchParams, signal } = options;

  const headers: Record<string, string> = {};
  if (!formData) {
    headers["Content-Type"] = "application/json";
  }
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, searchParams), {
    method,
    headers,
    body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
    signal,
  });

  if (response.status === 401 && !skipAuth) {
    forceLogout();
    throw new ApiRequestError(401, { code: "UNAUTHORIZED", message: "인증이 필요합니다." });
  }

  // 204 등 본문이 없는 응답
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new ApiRequestError(response.status, payload.error);
  }
  return payload.data as T;
}

/**
 * CSV 다운로드 전용. ApiResponse 봉투를 쓰지 않는 유일한 엔드포인트라 따로 둔다.
 * 파일명은 Content-Disposition 에서 읽는다 — CORS exposedHeaders 에 있어야 보인다.
 */
export async function downloadCsv(
  path: string,
  searchParams?: RequestOptions["searchParams"],
): Promise<{ blob: Blob; fileName: string }> {
  const token = getToken();
  const response = await fetch(buildUrl(path, searchParams), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) {
    forceLogout();
    throw new ApiRequestError(401, { code: "UNAUTHORIZED", message: "인증이 필요합니다." });
  }
  if (!response.ok) {
    throw new ApiRequestError(response.status, {
      code: "INTERNAL_ERROR",
      message: "다운로드에 실패했습니다.",
    });
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : "moneylog.csv";

  return { blob: await response.blob(), fileName };
}
