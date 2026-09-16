import { safeColor } from "@/lib/color";

/**
 * 차트 공통 데이터 형태.
 *
 * 차트 라이브러리를 쓰지 않고 SVG/CSS 로 직접 그리되,
 * 나중에 Recharts 로 갈아끼울 수 있도록 props 모양을 맞춰둔다.
 * Recharts 의 <Pie data={...} dataKey="value" nameKey="name" /> 가 그대로 받는 형태다.
 *
 * 추상화 계층을 만들라는 뜻이 아니다. 화면은 <CategoryDonut data={...} /> 만 알고,
 * 내부가 SVG 인지 Recharts 인지 모르면 된다.
 *
 * 교체 조건: 축 레이블·툴팁·줌·브러시 중 둘 이상이 필요해지면
 * 그때 recharts 를 설치하고 chart/ 안의 구현만 바꾼다.
 */
export interface ChartDatum {
  name: string;
  value: number;
  /** 카테고리 색. 없으면 팔레트에서 순서대로 배정한다 */
  color?: string;
}

/** 색이 없는 항목에 배정할 팔레트 (CLAUDE.md 8장) */
export const CHART_PALETTE = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#4F46E5",
  "#EC4899",
  "#14B8A6",
  "#8B5CF6",
  "#F97316",
  "#737373",
] as const;

/**
 * 색 결정. 차트 컴포넌트가 색을 정하지 않는다 —
 * DB 에 저장된 카테고리 색을 그대로 쓰고, 없을 때만 팔레트를 쓴다.
 *
 * ⚠️ #RRGGBB 형식을 검증한다. 검증 없이 인라인 스타일에 넣으면 CSS 값 주입 경로가 된다.
 */
export function resolveColor(color: string | undefined, index: number): string {
  return safeColor(color, CHART_PALETTE[index % CHART_PALETTE.length]);
}
