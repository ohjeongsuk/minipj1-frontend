import type { ApiError } from "@/types/api";

/**
 * 서버 error.code → 사용자에게 보이는 문구.
 * PRD 5.1 「에러 문구 매핑」 표가 정본이며, 이 파일 한 곳에서만 옮긴다.
 * 화면마다 문구를 따로 쓰면 표와 갈라진다.
 */

/** 화면이 이 문구를 어떻게 보여줘야 하는지 */
export type ErrorDisplay = "inline" | "toast" | "fullscreen" | "redirect";

export interface ResolvedError {
  message: string;
  display: ErrorDisplay;
}

const NETWORK_MESSAGE = "연결에 실패했습니다.";
const FALLBACK_MESSAGE = "일시적인 오류가 발생했습니다. 다시 시도해 주세요.";

const TABLE: Record<string, ResolvedError> = {
  EMAIL_DUPLICATED: { message: "이미 사용 중인 이메일입니다.", display: "inline" },
  CATEGORY_DUPLICATED: { message: "같은 이름의 카테고리가 이미 있습니다.", display: "inline" },
  CATEGORY_TYPE_MISMATCH: { message: "수입/지출 구분이 카테고리와 맞지 않습니다.", display: "inline" },
  TRANSACTION_NOT_FOUND: { message: "거래 내역을 찾을 수 없습니다.", display: "fullscreen" },
  CATEGORY_NOT_FOUND: { message: "카테고리를 찾을 수 없습니다.", display: "toast" },
  INVALID_CSV: { message: "CSV 파일을 읽을 수 없습니다. 형식을 확인해 주세요.", display: "toast" },
  NOT_FOUND: { message: "요청한 정보를 찾을 수 없습니다.", display: "toast" },
  METHOD_NOT_ALLOWED: { message: FALLBACK_MESSAGE, display: "toast" },
  FORBIDDEN: { message: "접근 권한이 없습니다.", display: "toast" },
  INTERNAL_ERROR: { message: FALLBACK_MESSAGE, display: "toast" },
};

/**
 * @param isLoginForm 로그인 폼에서 호출했는지.
 *   UNAUTHORIZED 는 맥락에 따라 다르게 다뤄야 한다 —
 *   로그인 폼에서는 인라인 안내, 그 외에는 문구 없이 /login 으로 보낸다.
 */
export function resolveError(error: ApiError | null | undefined, isLoginForm = false): ResolvedError {
  if (!error) {
    return { message: NETWORK_MESSAGE, display: "toast" };
  }

  if (error.code === "UNAUTHORIZED") {
    return isLoginForm
      // 계정 존재 여부를 구분해 노출하지 않는다. 비밀번호 오류와 미가입 이메일에 같은 문구를 쓴다
      ? { message: "이메일 또는 비밀번호가 올바르지 않습니다.", display: "inline" }
      : { message: "", display: "redirect" };
  }

  if (error.code === "INVALID_INPUT") {
    // 서버가 준 필드별 메시지를 그대로 보여준다
    return { message: error.message || "입력값을 확인해 주세요.", display: "inline" };
  }

  return TABLE[error.code] ?? { message: error.message || FALLBACK_MESSAGE, display: "toast" };
}

/** 네트워크 실패용. 에러 카드 + 재시도 버튼으로 보여준다 */
export function networkError(): ResolvedError {
  return { message: NETWORK_MESSAGE, display: "toast" };
}
