@AGENTS.md

# minipj1-frontend

머니로그(MoneyLog) 프론트엔드. Next.js (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4.

> **전체 스펙의 정본은 부모 저장소의 `mini-project/CLAUDE.md`다.**
> Claude Code는 상위 디렉토리를 거슬러 올라가며 `CLAUDE.md`를 로드하므로,
> 이 저장소에서 작업해도 부모 문서가 함께 읽힌다.
> 이 파일은 **이 저장소를 단독으로 클론했을 때 필요한 것**만 담는다.
> 충돌 시 부모 문서가 우선한다.

---

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프리렌더 단계까지 확인 — dev 에서 통과하고 build 에서 터지는 경우가 있다
npm run lint
```

- `.env.example`을 `.env.local`로 복사하고 값을 채운다 (`NEXT_PUBLIC_API_BASE_URL`).
- **shadcn 컴포넌트 추가 시 `--legacy-peer-deps`를 쓴다.** React 19 + Tailwind 4 조합에서 peer dependency 충돌이 난다.
- 백엔드가 `http://localhost:8080`에 떠 있어야 데이터 화면이 동작한다.

### ⚠️ 버전 상태 (미해결)

**부모 문서 §3은 Next.js 15를 요구하지만 현재 `next@16.3.5`가 설치되어 있다.**
근거는 AWS Amplify Hosting compute의 SSR 지원 범위가 12~15라는 점이다. Phase 7에서 정리한다.
그때까지 **`npm install next@latest`나 의존성 일괄 업데이트를 돌리지 않는다.**

**`package.json`의 `typescript` 캐럿 범위를 `^5`에서 넓히지 않는다.**
TypeScript 7은 프로그래밍 방식 JS API가 빠져 있어 `npm run lint`와 `next build` 타입체크가 모두 실패한다.

---

## 디렉토리

```
src/
├── app/
│   ├── (auth)/      login, signup
│   └── (main)/      dashboard, transactions, budgets, settings/categories, data
├── components/
│   ├── ui/          shadcn/ui
│   ├── common/      Pagination, EmptyState, ErrorState, Skeleton
│   ├── chart/       CategoryDonut, TrendLine, BudgetBar, MonthHeatmap
│   └── transaction/ TransactionList, TransactionRow, QuickAddBar, TransactionForm
├── hooks/           useTransactions, useStats, useAuth
├── lib/             apiClient, queryClient, money, date, utils
└── types/           백엔드 DTO 와 이름을 맞춘 응답 타입
```

- **`public/static`을 만들지 않는다.** Amplify 예약 경로다. 정적 파일은 `public/` 바로 아래나 `public/assets/`.
- **`middleware.ts`를 만들지 않는다.** 토큰이 localStorage 에 있어 서버에서 읽을 수 없다.
- **`/transactions/new` 페이지를 만들지 않는다.** 퀵 입력 바가 그 역할을 한다.

---

## 이 저장소에서 자주 틀리는 것

- **모든 `page.tsx`에 `"use client"`를 붙인다.** 서버에는 토큰이 없어 사실상 전부 클라이언트 컴포넌트다.
  루트 `app/layout.tsx`만 서버 컴포넌트로 두고 Provider 는 별도 클라이언트 컴포넌트로 분리한다.
- **동적 라우트 파라미터는 `useParams()`로 읽는다.** props 의 `params`는 Promise 다.
- **`useSearchParams`를 쓰는 컴포넌트는 `<Suspense>`로 감싼다.** 안 그러면 `npm run build`가 프리렌더에서 실패한다.
  개발 서버에서는 통과하므로 늦게 발견된다. 해당 화면은 `/transactions`와 `/dashboard`.
- **금액 입력에 `<input type="number">`를 쓰지 않는다.** 콤마가 들어가는 순간 값이 빈 문자열이 된다.
  `type="text"` + `inputMode="numeric"`, 상태는 콤마 없는 원본 문자열로 들고 표시할 때만 포맷한다.
- **금액 포맷·파싱은 `lib/money.ts`, 날짜 포맷은 `lib/date.ts`만 쓴다.** 화면에서 `toLocaleString`·`format`을 직접 부르지 않는다.
- **`toISOString()`을 쓰지 않는다.** UTC 로 변환되어 날짜가 하루 어긋난다. `date-fns`의 `format(d, "yyyy-MM-dd")`.
- **데이터 패칭은 React Query 훅으로 통일한다.** 컴포넌트 안에서 `fetch`를 직접 호출하지 않는다.
- **거래를 변경하면 `['stats']`와 `['budgets']`도 함께 무효화한다.** 놓치면 대시보드 합계가 갱신되지 않는다.
- **애니메이션 import 는 `motion/react`에서 한다.** `framer-motion`은 deprecated 별칭이다.
- **차트는 `src/components/chart/` 밖으로 나가지 않는다.** 화면에서 SVG 를 직접 그리지 않는다.
- **`dangerouslySetInnerHTML`을 쓰지 않는다.** 이 앱에 HTML 을 렌더할 이유가 없다.
- **`category.color`는 인라인 스타일에 넣기 전 `#RRGGBB` 정규식으로 검증한다.**
- **`any` 금지.** 불가피하면 `unknown` + 타입 가드.
- **주석은 한글로 작성한다.** 코드 식별자는 영문.

### 도입하지 않는 것

`react-hook-form` · `zod` · `@hookform/resolvers` · `recharts` · 차트/CSV/폼 라이브러리 · `next-navigation-guard`

> **`npx shadcn add form`을 실행하지 않는다.** 이 컴포넌트만 `react-hook-form` 위에 만들어져 있어
> 의존성이 함께 설치된다. 다른 shadcn 컴포넌트는 영향이 없다.

---

## 커밋

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` — **본문은 한글**
- 브랜치: `main` ← `develop` ← `feature/{작업명}`
- 백엔드와 **별도 저장소이므로 커밋을 섞지 않는다.**
- `AGENTS.md`의 자동 생성 블록은 지우지 말고 **작업과 함께 커밋**한다. `next dev`가 다시 만든다.
