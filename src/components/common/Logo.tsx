/**
 * 잔고 마크 — ₩ 와 순환 화살표.
 *
 * 원화 기호가 "다시 돌아오는" 한 바퀴 화살표 안에 있다.
 * 쌓인 기록이 예측으로 돌아온다는 뜻이다.
 *
 * ⚠️ 링의 코랄은 로고 전용이다(--logo-ring). UI 액센트는 인디고 하나뿐이고,
 *    로고가 그 규칙의 바깥에 서 있는 유일한 요소다. 다른 곳에 이 색을 쓰지 않는다.
 *
 * ⚠️ 파일(.svg)이 아니라 인라인 SVG 인 이유는 둘이다.
 *    - 링 색이 라이트/다크에서 다르다. <img> 로 두면 파일 두 개를 갈아끼워야 하고,
 *      그 전환이 CSS 가 아니라 JS 의 일이 되어 첫 페인트에 깜빡인다.
 *    - 화살촉과 ₩ 는 본문 색을 그대로 따른다. currentColor 면 토큰이 필요 없다.
 *
 * 사방 여백은 마크 높이의 1/8 이상, 최소 크기 24px. 회전·기울임·그림자를 주지 않는다.
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* 순환 화살표 링 — 코랄 */}
      <g stroke="var(--logo-ring)" fill="none" strokeWidth={20}>
        <path d="M216.8 86.6 A98 98 0 1 1 145 31.5" />
      </g>
      <circle cx="216.8" cy="86.6" r="10" fill="var(--logo-ring)" />
      {/* 화살촉과 ₩ — 본문 잉크색을 따른다 */}
      <path d="M148.8 9.8 L172.6 36.4 L141.2 53.2 Z" fill="currentColor" />
      <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 94 L94 172 L128 102 L162 172 L196 94" strokeWidth={17} />
        <path d="M60 127 L196 127" strokeWidth={13} />
      </g>
    </svg>
  );
}
