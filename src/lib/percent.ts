/**
 * 비율 배열을 합이 정확히 100 이 되는 정수 퍼센트로 바꾼다.
 *
 * ⚠️ 각 비율을 따로 반올림해 늘어놓으면 합이 99% 나 101% 로 보인다.
 *    도넛은 한 바퀴가 100% 라는 게 눈에 보이는 차트라 이 어긋남이 바로 드러난다.
 *
 * 최대잔여법(largest remainder)을 쓴다 — 내림한 뒤 남은 몫을
 * 소수부가 큰 순서대로 1씩 나눠 준다.
 *
 * 예측·집계 수식의 정본은 서버다. 여기서 하는 것은 표시용 반올림 배분뿐이며
 * 원본 비율 값을 바꾸지 않는다.
 */
export function distributePercent(ratios: number[], total = 100): number[] {
  const usable = ratios.map((r) => (Number.isFinite(r) && r > 0 ? r : 0));
  const sum = usable.reduce((acc, r) => acc + r, 0);
  if (sum <= 0) {
    return usable.map(() => 0);
  }

  const exact = usable.map((r) => (r / sum) * total);
  const floors = exact.map(Math.floor);
  let remainder = total - floors.reduce((acc, v) => acc + v, 0);

  // 소수부가 큰 항목부터 1 씩 가져간다
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (const { index } of order) {
    if (remainder <= 0) {
      break;
    }
    result[index] += 1;
    remainder -= 1;
  }
  return result;
}
