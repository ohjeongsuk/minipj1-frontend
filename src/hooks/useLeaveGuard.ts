"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 저장하지 않은 변경이 있을 때 이탈을 막는다 (TXN-09).
 *
 * App Router 에는 Pages Router 의 router.events 가 없고 공식 내비게이션 차단 API 도 없다.
 * 그래서 이탈 경로마다 막는 수단이 다르다.
 *
 *   ① 새로고침 · 탭 닫기 · 주소창 직접 이동 → beforeunload (브라우저 기본 대화상자)
 *   ② 화면 내 버튼                        → guard() 로 감싼 핸들러 + 확인 대화상자
 *   ③ 브라우저 뒤로가기                    → popstate + pushState 되돌리기
 *
 * ⚠️ 서드파티 내비게이션 가드를 설치하지 않는다.
 */
export function useLeaveGuard(dirty: boolean) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  /** 확인을 받으면 실행할 동작. 뒤로가기 경로에서는 목록 이동이 들어간다 */
  const pendingRef = useRef<(() => void) | null>(null);
  /** 더미 히스토리 엔트리를 쌓아 두었는지 */
  const dummyRef = useRef(false);
  /** 우리가 직접 부른 history.back() 이 만드는 popstate 를 무시하기 위한 플래그 */
  const ignoreRef = useRef(false);

  // ① 새로고침 · 탭 닫기. 문구는 브라우저가 정하므로 커스터마이즈할 수 없다
  useEffect(() => {
    if (!dirty) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ③ 뒤로가기.
  useEffect(() => {
    if (dirty && !dummyRef.current) {
      /*
       * popstate 는 취소할 수 없다. 이벤트가 올 때는 이미 이동한 뒤다.
       * 그래서 되돌릴 자리를 미리 만들어 둔다 — url 을 주지 않으면 같은 주소로 엔트리만 쌓인다.
       */
      window.history.pushState({ leaveGuard: true }, "");
      dummyRef.current = true;
    }
    if (!dirty && dummyRef.current) {
      // 저장 등으로 가드가 풀리면 쌓아둔 더미를 도로 걷어낸다.
      // 남겨두면 뒤로가기 한 번이 아무 일도 하지 않는 것처럼 보인다.
      dummyRef.current = false;
      ignoreRef.current = true;
      window.history.back();
    }
  }, [dirty]);

  useEffect(() => {
    const onPopState = () => {
      if (ignoreRef.current) {
        ignoreRef.current = false; // 우리가 부른 back() 이다
        return;
      }
      if (!dummyRef.current) {
        return;
      }
      // 이미 한 칸 뒤로 간 상태다. 다시 쌓아 화면을 붙잡고 확인을 받는다
      window.history.pushState({ leaveGuard: true }, "");
      pendingRef.current = () => {
        dummyRef.current = false;
        /*
         * history.go(-2) 로 더미와 현재 항목을 함께 건너뛸 수도 있지만,
         * 주소창에 직접 입력해 들어온 경우 되돌아갈 자리가 없어 사용자가 갇힌다.
         * 뒤로가기의 의도는 "이 거래에서 나가기"이므로 목록으로 보낸다.
         */
        router.replace("/transactions");
      };
      setOpen(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [router]);

  // ② 화면 내 버튼. 이동 동작을 감싸서 넘긴다
  const guard = useCallback(
    (action: () => void) => {
      if (!dirty) {
        action();
        return;
      }
      pendingRef.current = action;
      setOpen(true);
    },
    [dirty],
  );

  const confirmLeave = useCallback(() => {
    setOpen(false);
    const action = pendingRef.current;
    pendingRef.current = null;
    action?.();
  }, []);

  const cancelLeave = useCallback(() => {
    setOpen(false);
    pendingRef.current = null;
  }, []);

  return { guard, open, confirmLeave, cancelLeave };
}
