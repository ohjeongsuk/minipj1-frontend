"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/apiClient";
import { resolveError } from "@/lib/errorMessages";

/**
 * 로그인 (AUTH-04).
 *
 * ⚠️ 실패 문구는 계정 존재 여부를 구분하지 않는다.
 *    미가입 이메일과 비밀번호 오류가 같은 401 UNAUTHORIZED 로 오고,
 *    resolveError(_, true) 가 두 경우에 같은 문구를 돌려준다.
 */
export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    try {
      await login.mutateAsync({ email, password });
      router.replace("/dashboard");
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      setFormError(resolveError(apiError, true).message);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        // 폼 상단 인라인. role=alert 라 스크린리더가 즉시 읽는다
        <p role="alert" className="rounded-lg border border-destructive/40 px-3 py-2 text-caption text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={login.isPending} className="mt-2">
        {login.isPending ? "로그인 중…" : "로그인"}
      </Button>

      <p className="text-center text-caption text-muted-foreground">
        아직 계정이 없나요?{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </form>
  );
}
