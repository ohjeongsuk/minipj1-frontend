"use client";

import { ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";

/** Phase 9 에서 실제 화면으로 대체한다. 지금은 라우트 보호·네비게이션 검증용 자리다 */
export default function Page() {
  return <EmptyState icon={ReceiptText} title="거래 내역" description="Phase 9 에서 퀵 입력 바와 목록을 채웁니다." />;
}
