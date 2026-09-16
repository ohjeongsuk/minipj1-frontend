"use client";

import { Download, TriangleAlert, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExportCsv, useImportCsv } from "@/hooks/useDataTransfer";
import { ApiRequestError } from "@/lib/apiClient";
import { currentMonth, monthRange } from "@/lib/date";
import { resolveError } from "@/lib/errorMessages";
import type { ImportResultResponse } from "@/types/api";

/** 내보내기·가져오기가 같은 형식을 쓴다는 것을 화면에서 바로 보여준다 */
const FORMAT_COLUMNS = [
  { name: "날짜", note: "yyyy-MM-dd" },
  { name: "구분", note: "수입 또는 지출" },
  { name: "카테고리", note: "이름으로 매칭. 없는 이름은 실패" },
  { name: "금액", note: "0보다 큰 숫자" },
  { name: "거래처", note: "선택, 100자 이하" },
  { name: "메모", note: "선택, 500자 이하" },
];

export default function DataPage() {
  const defaultRange = monthRange(currentMonth());
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);

  const exportCsv = useExportCsv();
  const importCsv = useImportCsv();

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResultResponse | null>(null);
  const [importError, setImportError] = useState("");

  async function handleExport() {
    try {
      const fileName = await exportCsv.mutateAsync({ from, to });
      toast.success(`${fileName} 을(를) 내려받았습니다.`);
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      toast.error(resolveError(apiError).message);
    }
  }

  async function handleImport() {
    if (!file) {
      return;
    }
    setImportError("");
    setResult(null);
    try {
      const imported = await importCsv.mutateAsync(file);
      setResult(imported);
      toast.success(`${imported.imported}건 등록, ${imported.failed}건 실패`);
      setFile(null);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      setImportError(resolveError(apiError).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">데이터</h1>

      <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
        <h2 className="flex items-center gap-1.5 text-item font-semibold">
          <Download className="size-4" aria-hidden />
          내보내기
        </h2>
        <p className="text-caption text-muted-foreground">
          UTF-8 BOM 을 포함해 내려받으므로 Excel 에서 한글이 깨지지 않습니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-12">
          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <Label htmlFor="export-from">시작일</Label>
            <Input
              id="export-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <Label htmlFor="export-to">종료일</Label>
            <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div>
          <Button onClick={handleExport} disabled={exportCsv.isPending}>
            {exportCsv.isPending ? "준비 중…" : "CSV 내려받기"}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
        <h2 className="flex items-center gap-1.5 text-item font-semibold">
          <Upload className="size-4" aria-hidden />
          가져오기
        </h2>

        {/* 중복 검사를 하지 않는다. 안내하지 않으면 사용자가 모르고 두 번 올린다 */}
        <p className="flex items-start gap-1.5 rounded-lg border border-border px-3 py-2 text-caption text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          이미 가져온 파일을 다시 올리면 중복 등록됩니다. 최대 1MB · 5,000행까지 받습니다.
        </p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="import-file">CSV 파일</Label>
          <Input
            id="import-file"
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {importError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 px-3 py-2 text-caption text-destructive"
          >
            {importError}
          </p>
        ) : null}

        <div>
          <Button onClick={handleImport} disabled={!file || importCsv.isPending}>
            {importCsv.isPending ? "가져오는 중…" : "가져오기"}
          </Button>
        </div>

        {result ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4" role="status">
            <p className="text-body">
              <strong className="text-income">{result.imported}건</strong> 등록,{" "}
              <strong className={result.failed > 0 ? "text-expense" : undefined}>
                {result.failed}건
              </strong>{" "}
              실패
            </p>
            {result.errors.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {result.errors.map((row) => (
                  <li key={row.line} className="text-caption text-muted-foreground">
                    <span className="tabular-nums">{row.line}행</span> · {row.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border p-5">
        <h2 className="text-item font-semibold">파일 형식</h2>
        <p className="text-caption text-muted-foreground">
          헤더 6열 고정입니다. 내보내기와 가져오기가 같은 형식을 씁니다.
        </p>
        <ul className="flex flex-col gap-1">
          {FORMAT_COLUMNS.map((column, index) => (
            <li key={column.name} className="flex gap-2 text-caption">
              <span className="w-20 shrink-0 font-medium tabular-nums">
                {index + 1}. {column.name}
              </span>
              <span className="text-muted-foreground">{column.note}</span>
            </li>
          ))}
        </ul>
        <p className="text-caption text-muted-foreground">
          Excel 이 되돌려준 파일도 읽습니다 — CP949 인코딩, 금액의 천단위 콤마(
          <span className="tabular-nums">12,500</span>), <span className="tabular-nums">2026.09.14</span>{" "}
          형태의 날짜를 모두 인식합니다.
        </p>
      </section>
    </div>
  );
}
