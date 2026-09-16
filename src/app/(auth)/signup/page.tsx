"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignup } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/apiClient";
import { resolveError } from "@/lib/errorMessages";

/**
 * 회원가입 (AUTH-01 ~ AUTH-03, AUTH-05).
 *
 * ⚠️ 비밀번호 상한은 문자 수가 아니라 바이트다.
 *    BCrypt 한계가 72바이트이고 UTF-8 한글 1자는 3바이트라 한글 25자면 75바이트로 넘는다.
 *    pw.length 로 세면 이 입력을 통과시켜 서버 인코딩 단계에서 터진다.
 *    백엔드도 @MaxByteLength(72) 로 막지만, 여기서 제출 전에 알려주는 것이 요구사항이다.
 */
function validatePassword(password: string): string {
  if (password.length === 0) {
    return "";
  }
  if (password.length < 6) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (new TextEncoder().encode(password).length > 72) {
    return "비밀번호가 너무 깁니다. (한글은 1자가 3바이트로 계산됩니다)";
  }
  return "";
}

export default function SignupPage() {
  const router = useRouter();
  const signup = useSignup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");

  const passwordError = validatePassword(password);
  const canSubmit = email !== "" && nickname !== "" && password !== "" && passwordError === "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEmailError("");
    setFormError("");
    if (!canSubmit) {
      return; // 서버에 보내지 않는다. 인라인 안내가 이미 떠 있다
    }
    try {
      await signup.mutateAsync({ email, password, nickname });
      // 기본 카테고리 9개는 서버가 같은 트랜잭션에서 만들어 둔 상태다 (AUTH-05)
      router.replace("/dashboard");
    } catch (error) {
      const apiError = error instanceof ApiRequestError ? error.error : null;
      const { message } = resolveError(apiError);
      if (apiError?.code === "EMAIL_DUPLICATED") {
        setEmailError(message);
      } else {
        setFormError(message);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
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
          aria-invalid={emailError !== ""}
          aria-describedby={emailError ? "email-error" : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError ? (
          <p id="email-error" role="alert" className="text-caption text-destructive">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={passwordError !== ""}
          aria-describedby="password-help"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p
          id="password-help"
          className={passwordError ? "text-caption text-destructive" : "text-caption text-muted-foreground"}
          role={passwordError ? "alert" : undefined}
        >
          {passwordError || "6자 이상 · 최대 72바이트 (한글은 1자가 3바이트로 계산됩니다)"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          required
          maxLength={50}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={!canSubmit || signup.isPending} className="mt-2">
        {signup.isPending ? "가입 중…" : "회원가입"}
      </Button>

      <p className="text-center text-caption text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          로그인
        </Link>
      </p>
    </form>
  );
}
