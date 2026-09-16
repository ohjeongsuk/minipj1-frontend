/**
 * 카테고리 색 검증.
 *
 * ⚠️ 검증 없이 style={{ background: color }} 에 넣으면 CSS 값 주입 경로가 된다.
 *    서버가 §4 제약으로 검증하지만 프론트에서도 한 번 확인한다.
 *    차트와 거래 목록 배지가 같은 규칙을 써야 하므로 여기 한 곳에 둔다.
 */
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(color: string | null | undefined): boolean {
  return typeof color === "string" && HEX_COLOR.test(color);
}

/** 형식이 맞으면 그대로, 아니면 fallback 을 돌려준다 */
export function safeColor(color: string | null | undefined, fallback: string): string {
  return isHexColor(color) ? (color as string) : fallback;
}
