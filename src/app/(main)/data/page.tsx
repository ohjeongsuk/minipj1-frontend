"use client";

import { FileSpreadsheet } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";

/** Phase 11 에서 실제 화면으로 대체한다. 지금은 라우트 보호·네비게이션 검증용 자리다 */
export default function Page() {
  return <EmptyState icon={FileSpreadsheet} title="데이터" description="Phase 11 에서 CSV 가져오기·내보내기를 채웁니다." />;
}
