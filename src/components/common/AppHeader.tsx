"use client";

import {
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Tags,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

import { Button } from "@/components/ui/button";

/**
 * 공통 헤더 (AUTH-06, AUTH-08).
 *
 * ⚠️ 이메일은 /auth/me 응답에 들어 있지만 화면에 표시하지 않는다. 닉네임만 보여준다.
 *
 * 데스크톱은 상단 한 줄, 모바일은 하단 탭 바다.
 * 두 목록이 갈라지지 않도록 NAV 배열 하나를 양쪽이 함께 쓴다.
 */
const NAV = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/transactions", label: "내역", icon: ReceiptText },
  { href: "/budgets", label: "예산", icon: Wallet },
  { href: "/settings/categories", label: "카테고리", icon: Tags },
  { href: "/data", label: "데이터", icon: FileSpreadsheet },
] as const;

interface AppHeaderProps {
  nickname: string;
  onLogout: () => void;
}

export function AppHeader({ nickname, onLogout }: AppHeaderProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* 그림자 대신 1px border 로 면을 구분한다 */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
          <Link href="/dashboard" className="text-item font-semibold">
            머니로그
          </Link>

          <nav aria-label="주요 메뉴" className="hidden flex-1 items-center gap-1 sm:flex">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-body transition-colors hover:bg-accent",
                  isActive(href) ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 sm:ml-0">
            <span className="text-body font-medium">{nickname}</span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 모바일 하단 탭 바. 데스크톱에서는 숨긴다 */}
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card sm:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-caption",
              isActive(href) ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
