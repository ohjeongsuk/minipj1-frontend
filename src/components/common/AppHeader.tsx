"use client";

import {
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ReceiptText,
  Tags,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";

/**
 * 공통 헤더 (AUTH-06, AUTH-08).
 *
 * ⚠️ 이메일은 /auth/me 응답에 들어 있지만 화면에 표시하지 않는다. 닉네임만 보여준다.
 *
 * 데스크톱은 상단 세그먼트 컨트롤, 모바일은 하단 탭 바다.
 * 두 목록이 갈라지지 않도록 NAV 배열 하나를 양쪽이 함께 쓴다.
 *
 * 데스크톱 탭은 회색 트랙(bg-muted) 위에 활성 항목만 흰 pill 로 띄운다.
 * 텍스트 굵기만으로 활성을 표현하면 링크 다섯 개 중 어디에 있는지 한눈에 안 들어온다.
 *
 * ⚠️ pill 에 그림자를 쓰지 않는다. 트랙이 #F5F5F5, pill 이 #FFFFFF 라
 *    1px border 만으로 떠 보인다. 그림자는 모달·드롭다운 전용이다.
 */
const NAV = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/transactions", label: "내역", icon: ReceiptText },
  { href: "/budgets", label: "예산", icon: Wallet },
  { href: "/chat", label: "챗봇", icon: MessageCircle },
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
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
          <Link href="/dashboard" className="text-item font-semibold">
            머니로그
          </Link>

          <nav
            aria-label="주요 메뉴"
            className="hidden items-center gap-1 rounded-lg bg-muted p-1 sm:flex"
          >
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-body transition-colors",
                  isActive(href)
                    ? "border border-border bg-card font-semibold text-foreground"
                    : "border border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden text-body font-medium sm:inline">{nickname}</span>
            <ThemeToggle />
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
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-muted sm:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-caption transition-colors",
              // 활성 탭은 액센트로 칠한다. 굵기만으로는 작은 글자에서 구분이 약하다
              isActive(href) ? "font-semibold text-primary" : "text-muted-foreground",
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
