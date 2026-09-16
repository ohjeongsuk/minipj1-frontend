"use client";

import { Wallet } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";

/** Phase 11 에서 실제 화면으로 대체한다. 지금은 라우트 보호·네비게이션 검증용 자리다 */
export default function Page() {
  return <EmptyState icon={Wallet} title="월 예산" description="Phase 11 에서 카테고리별 예산 설정을 채웁니다." />;
}
