export { cn } from "cn"

/**
 * 하이라인 목록.
 *
 * 테두리는 <ul> 이 한 번만 갖고 행 사이는 1px 구분선으로만 나눈다.
 * 항목마다 카드를 두면 스무 건이 이어지는 화면에서 테두리 스무 개가
 * 내용보다 먼저 눈에 들어온다.
 *
 * 컴포넌트가 아니라 문자열 상수로 두는 이유는 거래 목록의 행이 motion.li 라
 * 래퍼 컴포넌트를 끼울 수 없어서다. 목록 네 곳(거래·카테고리·예산·스켈레톤)이
 * 같은 값을 쓰므로 정의는 여기 한 곳에만 둔다.
 *
 * ⚠️ 구분선이 행의 border-t 라, 행이 사라지는 애니메이션에는
 *    height 뿐 아니라 borderTopWidth 도 0 으로 보내야 한다.
 *    안 그러면 사라진 자리에 1px 선이 남는다 (TransactionRow 참조).
 */
export const HAIRLINE_LIST = "overflow-hidden rounded-xl border border-border bg-card"
export const HAIRLINE_ITEM = "border-t border-border first:border-t-0"
