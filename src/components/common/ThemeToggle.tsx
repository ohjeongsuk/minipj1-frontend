"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * 테마 전환 버튼 (시스템 → 라이트 → 다크 → 시스템).
 *
 * 드롭다운을 두지 않고 버튼 하나로 순환시킨다. 선택지가 셋뿐이고
 * 헤더는 이미 항목이 많아 메뉴를 하나 더 늘릴 이유가 없다.
 *
 * ⚠️ "시스템" 은 data-theme 속성을 지우는 것으로 표현한다.
 *    속성이 없으면 globals.css 의 prefers-color-scheme 미디어쿼리가
 *    CSS 만으로 처리하므로 JS 가 개입할 일이 없다.
 *
 * ⚠️ 첫 렌더에서는 아이콘을 그리지 않는다(mounted 가드).
 *    서버는 localStorage 를 읽을 수 없어 항상 "시스템" 으로 렌더하는데,
 *    저장된 값이 "다크" 인 사용자는 클라이언트에서 다른 아이콘이 나와
 *    hydration 불일치가 난다. 아이콘만 늦게 그리면 되고,
 *    테마 자체는 layout.tsx 의 인라인 스크립트가 이미 확정해 둔 상태다.
 */
const KEY = "moneylog_theme";

type Theme = "system" | "light" | "dark";

/** 순환 순서. 시스템을 처음에 둬 기본값으로 돌아오기 쉽게 한다 */
const ORDER: Theme[] = ["system", "light", "dark"];

const META: Record<Theme, { icon: typeof Sun; label: string }> = {
  system: { icon: Monitor, label: "시스템 설정" },
  light: { icon: Sun, label: "라이트 모드" },
  dark: { icon: Moon, label: "다크 모드" },
};

function read(): Theme {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function apply(next: Theme) {
  const root = document.documentElement;
  if (next === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", next);
  }
  try {
    if (next === "system") {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, next);
    }
  } catch {
    // 사생활 보호 모드에서는 저장이 막힌다. 이번 세션 동안만 적용되고 끝난다
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(read());
    setMounted(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    apply(next);
    setTheme(next);
  }

  const { icon: Icon, label } = META[theme];

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycle}
      aria-label={`테마: ${label}. 누르면 다음 테마로 바뀝니다`}
      title={label}
    >
      {/* 서버와 클라이언트의 아이콘이 갈릴 수 있어 마운트 후에만 그린다 */}
      {mounted ? <Icon className="size-4" aria-hidden /> : <span className="size-4" />}
    </Button>
  );
}
