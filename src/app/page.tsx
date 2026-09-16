"use client";

import { Inbox } from "lucide-react";
import { toast } from "sonner";

import { BudgetBar } from "@/components/chart/BudgetBar";
import { CategoryDonut } from "@/components/chart/CategoryDonut";
import { MonthHeatmap } from "@/components/chart/MonthHeatmap";
import { TrendLine } from "@/components/chart/TrendLine";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton, ListSkeleton } from "@/components/common/ListSkeleton";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAmount, formatPercent, parseAmount } from "@/lib/money";
import { formatMonthLabel, today } from "@/lib/date";

/**
 * Phase 7 스캐폴딩 미리보기.
 *
 * 디자인 토큰과 공통·차트 컴포넌트가 라이트/다크 양쪽에서 제대로 그려지는지
 * 눈으로 확인하는 페이지다. Phase 8 에서 /login 리다이렉트로 대체한다.
 */

const CATEGORY_DATA = [
  { name: "식비", value: 412000, color: "#EF4444" },
  { name: "교통", value: 133000, color: "#F59E0B" },
  { name: "주거/통신", value: 285000, color: "#6366F1" },
  { name: "문화/여가", value: 96000, color: "#EC4899" },
  { name: "기타", value: 54000 },
];

const TREND_DATA = [
  { name: "4월", value: 1_620_000 },
  { name: "5월", value: 1_845_000 },
  { name: "6월", value: 1_410_000 },
  { name: "7월", value: 2_010_000 },
  { name: "8월", value: 1_760_000 },
  { name: "9월", value: 980_000 },
];

const BUDGET_DATA = [
  { name: "식비", value: 412000, color: "#EF4444" },
  { name: "교통", value: 133000, color: "#F59E0B" },
  { name: "문화/여가", value: 96000, color: "#EC4899" },
];

const HEATMAP_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: `2026-09-${String(i + 1).padStart(2, "0")}`,
  value: [0, 12000, 38000, 5000, 74000, 0, 21000][i % 7],
}));

export default function ScaffoldingPreview() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">머니로그</h1>
          <Badge variant="secondary">Phase 7 스캐폴딩</Badge>
        </div>
        <p className="text-caption text-muted-foreground">
          {formatMonthLabel("2026-09")} · 오늘 {today()}
        </p>
      </header>

      <Section title="타이포 · 금액">
        <div className="flex flex-col gap-1">
          <p className="text-item font-semibold">항목 제목 16px semibold</p>
          <p className="text-body">본문 15px — 여백과 타이포그래피로 위계를 만든다</p>
          <p className="text-caption text-muted-foreground">캡션 13px 보조 텍스트</p>
        </div>
        <div className="flex flex-wrap items-baseline gap-4 tabular-nums">
          <span className="text-income text-item font-semibold">
            +{formatAmount(3_200_000)}원
          </span>
          <span className="text-expense text-item font-semibold">
            -{formatAmount(1_842_300)}원
          </span>
          <span className="text-muted-foreground">소진율 {formatPercent(0.687)}</span>
        </div>
        <p className="text-caption text-muted-foreground">
          parseAmount(&quot;1,250,000&quot;) → {parseAmount("1,250,000")} · formatAmount(1250000) →{" "}
          {formatAmount(1250000)}
        </p>
      </Section>

      <Section title="입력 · 버튼">
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="amount">금액</Label>
          {/* type="number" 를 쓰지 않는다. 콤마가 들어가면 값이 사라진다 */}
          <Input id="amount" type="text" inputMode="numeric" defaultValue="1,250,000" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toast.success("저장했습니다.")}>저장</Button>
          <Button variant="outline" onClick={() => toast.error("연결에 실패했습니다.")}>
            실패 토스트
          </Button>
          <Button variant="ghost">취소</Button>
        </div>
      </Section>

      <Section title="차트 — CategoryDonut">
        <CategoryDonut data={CATEGORY_DATA} />
      </Section>

      <Section title="차트 — TrendLine">
        <TrendLine data={TREND_DATA} />
      </Section>

      <Section title="차트 — BudgetBar">
        <BudgetBar data={BUDGET_DATA} max={600000} showRatio />
      </Section>

      <Section title="차트 — MonthHeatmap">
        <MonthHeatmap data={HEATMAP_DATA} />
      </Section>

      <Section title="상태 — 로딩">
        <CardSkeleton />
        <ListSkeleton rows={3} />
      </Section>

      <Section title="상태 — 빈 상태 / 에러">
        <EmptyState
          icon={Inbox}
          title="아직 기록이 없어요"
          description="퀵 입력 바에서 첫 거래를 등록해 보세요."
          actionLabel="거래 등록하기"
          onAction={() => toast("퀵 입력 바로 이동합니다.")}
        />
        {/* onRetry 는 필수 prop 이다. 빼면 타입 에러가 난다 */}
        <ErrorState message="연결에 실패했습니다." onRetry={() => toast("다시 시도합니다.")} />
      </Section>

      <Section title="페이지네이션">
        <Pagination currentPage={2} totalPages={12} onPageChange={(p) => toast(`${p + 1} 페이지`)} />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
