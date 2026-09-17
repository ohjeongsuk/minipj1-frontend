"use client";

import { cn } from "@/lib/utils";

/**
 * 본문 양옆 여백에 띄우는 광고 자리 (테스트용 플레이스홀더).
 *
 * ⚠️ 실제 광고 스크립트를 넣지 않았다. 외부 스크립트는 새 의존성이고
 *    (CLAUDE.md 「임의로 라이브러리를 추가하지 않는다」), 로컬 개발 화면에
 *    외부 요청을 만들 이유도 없다. 크기와 자리만 잡아 둔 껍데기다.
 *
 * ⚠️ 1400px 미만에서는 아예 렌더하지 않는다. 본문이 max-w-5xl(1024px) 이라
 *    여백이 (뷰포트-1024)/2 인데, 160px 광고에 여유 24px 을 더하면
 *    184px 이 필요하고 그 조건이 1392px 이다. 더 좁은 화면에서 띄우면
 *    본문 위로 올라타므로 임의 브레이크포인트로 잘라낸다.
 *
 * ⚠️ 세로 가운데가 아니라 헤더 아래(top-24)에 붙인다. 가운데 정렬하면
 *    화면이 낮을 때 오른쪽 아래 챗봇 버튼과 겹친다. 높이도 뷰포트에
 *    맞춰 줄여 그 아래로 내려오지 않게 한다.
 */
interface AdSlotProps {
  side: "left" | "right";
  /** 표기용 규격. 실제 광고를 붙일 때 이 크기로 요청한다 */
  label?: string;
}

export function AdSlot({ side, label = "160 × 600" }: AdSlotProps) {
  return (
    <aside
      aria-label="광고"
      className={cn(
        "fixed top-24 z-30 hidden w-40 flex-col items-center justify-center gap-2 rounded-xl",
        "border border-dashed border-border bg-muted/50 text-center",
        "h-[600px] max-h-[calc(100dvh-12rem)]",
        "min-[1400px]:flex",
        side === "left" ? "left-6" : "right-6",
      )}
    >
      <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[0.625rem] text-muted-foreground">
        광고
      </span>
      <p className="text-caption text-muted-foreground tabular-nums">{label}</p>
      <p className="px-3 text-[0.625rem] leading-relaxed text-muted-foreground/70">
        테스트 슬롯입니다.
        <br />
        실제 광고는 아직 연결되지 않았습니다.
      </p>
    </aside>
  );
}
