"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { downloadCsv, request } from "@/lib/apiClient";
import { INVALIDATE_ON_TRANSACTION_CHANGE } from "@/lib/queryKeys";
import type { ImportResultResponse } from "@/types/api";

/**
 * CSV 내보내기.
 *
 * ApiResponse 봉투를 쓰지 않는 유일한 엔드포인트라 downloadCsv 를 따로 쓴다.
 * 파일명은 Content-Disposition 에서 읽는다 — CORS exposedHeaders 에 없으면
 * 브라우저가 헤더를 숨겨 파일명이 download 가 된다.
 */
export function useExportCsv() {
  return useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const { blob, fileName } = await downloadCsv("/api/v1/data/export", { from, to });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // 해제하지 않으면 blob 이 문서가 닫힐 때까지 메모리에 남는다
      URL.revokeObjectURL(url);

      return fileName;
    },
  });
}

/**
 * CSV 가져오기.
 *
 * 부분 성공을 허용한다 — 실패한 행만 건너뛰고 사유를 행 번호와 함께 돌려준다.
 * 중복 검사를 하지 않으므로 같은 파일을 두 번 올리면 거래가 두 번 등록된다.
 *
 * ⚠️ 성공하면 거래 변경과 같은 3종을 무효화한다.
 *    대량 등록이라 대시보드 합계와 예산 소진율이 모두 바뀐다.
 */
export function useImportCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      // formData 를 주면 Content-Type 을 브라우저가 boundary 와 함께 정한다
      return request<ImportResultResponse>("/api/v1/data/import", {
        method: "POST",
        formData,
      });
    },
    onSuccess: () => {
      for (const key of INVALIDATE_ON_TRANSACTION_CHANGE) {
        queryClient.invalidateQueries({ queryKey: [...key] });
      }
    },
  });
}
