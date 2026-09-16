/**
 * 금액 포맷·파싱. 모든 화면이 이 두 함수만 쓴다.
 * 화면에서 toLocaleString 을 직접 부르지 않는다.
 */

/**
 * 표시용 포맷. 천단위 콤마를 넣는다.
 *
 * ⚠️ 금액 입력에 <input type="number"> 를 쓰지 않는다.
 *    콤마가 들어가는 순간 값이 빈 문자열이 되고, 모바일에서 스피너가 뜨며
 *    스크롤로 값이 바뀌는 사고가 난다.
 *    type="text" + inputMode="numeric" 을 쓰고, 상태는 콤마 없는 원본 문자열로 든다.
 */
export function formatAmount(
  value: number | string | null | undefined,
  fractionDigits = 0,
): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const numeric = typeof value === "string" ? Number(parseAmount(value)) : value;
  if (!Number.isFinite(numeric)) {
    return "";
  }
  /*
   * 표시는 원 단위 정수로 한다. 화면에 2,048,242.84원 처럼 소수점이 보이면
   * 가계부에서 읽히지 않는다. 반올림이며 저장값은 건드리지 않는다 —
   * 서버는 NUMERIC(15,2) 로 소수부를 그대로 보관한다.
   *
   * ⚠️ 입력 필드는 fractionDigits: 2 로 부른다.
   *    입력값을 표시할 때 반올림해 버리면 화면의 숫자와 실제로 저장될 값이 어긋난다.
   */
  return numeric.toLocaleString("ko-KR", { maximumFractionDigits: fractionDigits });
}

/**
 * 입력값에서 숫자만 남긴다. 반환은 콤마 없는 원본 문자열이다.
 *
 * ⚠️ dirty 판정도 이 정규화 값끼리 비교한다.
 *    포맷된 값끼리 비교하면 콤마 유무로 오판한다.
 */
export function parseAmount(raw: string | null | undefined): string {
  if (!raw) {
    return "";
  }
  return raw.replace(/[^\d.]/g, "");
}

/** 수입/지출 부호를 붙인 표시용 문자열 */
export function formatSignedAmount(value: number, type: "INCOME" | "EXPENSE"): string {
  const sign = type === "INCOME" ? "+" : "-";
  return `${sign}${formatAmount(value)}원`;
}

/** 비율(0~1)을 퍼센트 문자열로. NaN·Infinity 는 0% 로 표시한다 */
export function formatPercent(ratio: number | null | undefined, digits = 0): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
    return "0%";
  }
  return `${(ratio * 100).toFixed(digits)}%`;
}
