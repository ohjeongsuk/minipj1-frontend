"use client";

import { TriangleAlert } from "lucide-react";

import { formatPercent } from "@/lib/money";
import type { Anomaly } from "@/types/api";

/**
 * 평소보다 튄 카테고리 안내 (STAT-05).
 *
 * 빈 배열이면 카드 자체를 렌더링하지 않는다. 빈 카드가 남으면
 * "이상치가 없다"가 아니라 "아직 로딩 중이다"처럼 보인다.
 *
 * 경과 7일 미만이면 서버가 빈 배열을 준다 — 월초에는 노이즈가 커서
 * 1일에 외식 한 번이 식비 3000% 증가로 나온다.
 */
const MAX_ITEMS = 3;

export function AnomalyCard({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-5">
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <TriangleAlert className="size-4" aria-hidden />
        평소와 다른 지출
      </span>
      <ul className="flex flex-col gap-1">
        {anomalies.slice(0, MAX_ITEMS).map((anomaly) => (
          <li key={anomaly.categoryId} className="text-body">
            <strong className="font-semibold">{anomaly.name}</strong>가 평소보다{" "}
            <span
              className={anomaly.deltaRatio >= 0 ? "text-expense" : "text-income"}
            >
              {formatPercent(Math.abs(anomaly.deltaRatio))}
            </span>{" "}
            {anomaly.deltaRatio >= 0 ? "높아요" : "낮아요"}
          </li>
        ))}
      </ul>
    </div>
  );
}
