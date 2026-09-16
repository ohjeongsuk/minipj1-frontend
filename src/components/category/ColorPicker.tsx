"use client";

import { Check } from "lucide-react";
import { cn } from "cn";

import { CHART_PALETTE } from "@/components/chart/types";
import { Label } from "@/components/ui/label";
import { isHexColor } from "@/lib/color";

/**
 * 카테고리 색 선택.
 *
 * 팔레트(CLAUDE.md 8장)에서 고르거나 직접 고른다.
 * 직접 고르기는 네이티브 <input type="color"> 를 쓴다 — OS 색 선택기가 뜨고
 * 항상 #rrggbb 형식의 값을 돌려주므로 서버의 #RRGGBB 정규식을 그대로 통과한다.
 */
interface ColorPickerProps {
  value: string;
  onChange: (next: string) => void;
  id: string;
}

export function ColorPicker({ value, onChange, id }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>색</Label>
      <div className="flex flex-wrap items-center gap-2">
        {CHART_PALETTE.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              aria-label={`색 ${color}`}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              className={cn(
                "flex size-7 items-center justify-center rounded-full border-2 transition-colors",
                selected ? "border-ring" : "border-transparent",
              )}
              style={{ backgroundColor: color }}
            >
              {selected ? <Check className="size-4 text-white" aria-hidden /> : null}
            </button>
          );
        })}

        {/* 직접 고르기. 팔레트 밖의 색을 쓰고 싶을 때 */}
        <input
          id={id}
          type="color"
          value={isHexColor(value) ? value : "#737373"}
          onChange={(e) => onChange(e.target.value)}
          className="size-7 cursor-pointer rounded-full border border-input bg-transparent p-0.5"
        />
      </div>
    </div>
  );
}
