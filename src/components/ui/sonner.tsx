"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// theme 을 "system" 으로 고정한다. 테마 패키지를 쓰지 않는다.
// 그 패키지는 class 전략(<html class="dark">)용이고, 이 프로젝트는 토글 UI 가 없어
// prefers-color-scheme 미디어쿼리만 쓴다. class 전략은 서버 렌더 시점에 클래스가 없어 FOUC 가 생긴다.
// sonner 의 "system" 도 브라우저의 prefers-color-scheme 를 직접 읽으므로 동작은 동일하다.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
