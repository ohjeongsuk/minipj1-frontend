"use client";

import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";

/** Phase 10 에서 실제 화면으로 대체한다. 지금은 라우트 보호·네비게이션 검증용 자리다 */
export default function Page() {
  return <EmptyState icon={LayoutDashboard} title="월 대시보드" description="Phase 10 에서 요약·차트·예측·예산을 채웁니다." />;
}
