# minipj1-frontend

잔고(Zango) 프론트엔드. **Next.js 15 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4**.

> 전체 스펙의 정본은 문서 저장소 `mini-project/CLAUDE.md` 다.
> 이 저장소 전용 규칙은 `CLAUDE.md`(같은 폴더)에 있다.

`v1.0.0`

---

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프리렌더까지 확인 — dev 에서 통과하고 build 에서 터지는 경우가 있다
npm run lint
```

- **백엔드가 `http://localhost:8080` 에 떠 있어야 데이터 화면이 동작한다.**
  프론트만 띄우면 화면은 정상적으로 그려지고 API 호출만 실패하므로, 로그인이 안 될 때 백엔드부터 확인한다.
- API 주소를 바꾸려면 `.env.example` 을 `.env.local` 로 복사해 `NEXT_PUBLIC_API_BASE_URL` 을 채운다.
  없으면 `http://localhost:8080` 으로 동작한다.

> ⚠️ **`npm run build` 전에 `npm run dev` 를 내린다.** 둘은 같은 `.next` 디렉터리를 쓴다.
>
> | 어느 쪽이 방해받나 | 증상 |
> |---|---|
> | build 가 dev 의 청크를 덮어씀 | 브라우저가 **빈 화면**. 콘솔에 청크 404 |
> | dev 가 build 의 매니페스트를 건드림 | `Cannot find module for page: ...` 로 프리렌더 실패 |
>
> 둘 다 **소스와 무관하다.** 막히면 dev 를 끄고 `rm -rf .next` 후 다시 빌드한다.
>
> ⚠️ **Windows 에서 dev 서버를 끌 때 Git Bash 의 `pkill -f next` 는 조용히 실패한다.**
> PowerShell 로 끈다. `npm run dev` 하나가 프로세스 3개(npm 래퍼 → `next dev` → 서버 워커)를 만들고,
> 하나라도 남으면 다음 실행이 **3001 포트로 떨어져** 백엔드 CORS(3000 만 허용)에 막힌다.

---

## 화면

| 경로 | 내용 |
|---|---|
| `/login` `/signup` | 이메일 로그인 · 구글 로그인 |
| `/dashboard` | 월 요약 · 카테고리 도넛 · 일별 추이 · 캘린더 히트맵 · 예측 · 예산 소진율 |
| `/transactions` | 거래 목록 + **퀵 입력 바** · 필터 · 검색 · 페이지네이션 |
| `/transactions/[id]` | 거래 상세(항상 편집 가능) · 삭제 · 이탈 확인 |
| `/budgets` | 카테고리별 월 예산 설정 |
| `/settings/categories` | 카테고리 관리 |
| `/data` | CSV 가져오기 / 내보내기 |
| `/chat` | 챗봇 전체 화면. 어느 화면에서나 **떠 있는 창**으로도 열린다 |

**`/transactions/new` 페이지를 만들지 않았다.** 목록 상단의 퀵 입력 바가 그 역할을 한다 —
입력 필드가 여섯 개뿐인데 페이지를 나누면 "목록 → 클릭 → 이동 → 입력 → 저장 → 복귀" 다섯 단계가 되고,
그 마찰이 가계부 앱을 그만두게 만든다.

### 챗봇

자연어로 물으면 기존 집계를 찾아 문장으로 답한다. **조회 전용이라 기록을 바꾸지 않는다.**

```
"이번달 얼마 썼어?"        월 요약        "지난달 식비 얼마 썼어?"   카테고리별
"최근 지출 3건 보여줘"     최근 내역      "식비 예산 얼마 남았어?"   예산 소진율
"이 속도면 얼마 쓸까?"     예상 지출      "고정지출 뭐 있어?"        고정지출
"15일 얼마 썼어?"          특정 하루
```

- **입구가 둘이고 대화 기록을 공유한다.** 떠 있는 창(우측 하단 버튼)과 `/chat` 전체 화면이
  `ChatPanel` 하나와 같은 `localStorage` 키를 쓴다. `/chat` 에서는 버튼을 숨긴다.
- **답변 문장은 서버가 만든다.** 화면에서 다시 만들면 두 곳이 갈라지는데,
  이 저장소에는 그것을 검증할 테스트 러너가 없다.
- 대화 기록은 `moneylog_chat_{userId}` 에 최근 50개까지 저장하고 **로그아웃 시 지운다**.

---

## 구조

```
src/
├── app/
│   ├── (auth)/      login, signup, oauth/callback
│   └── (main)/      dashboard, transactions, budgets, settings/categories, data
├── components/
│   ├── ui/          shadcn/ui (스타일 radix-nova)
│   ├── common/      Pagination, EmptyState, ErrorState, Skeleton, AppHeader, ThemeToggle
│   ├── chart/       CategoryDonut, TrendLine, BudgetBar, MonthHeatmap
│   ├── chat/        ChatWidget, ChatPanel, ChatMessage, ChatBits
│   └── transaction/ TransactionList, TransactionRow, QuickAddBar, TransactionForm
├── hooks/           useTransactions, useStats, useAuth, useChat
├── lib/             apiClient, queryClient, money, date, color, chatStorage, utils
└── types/           백엔드 DTO 와 이름을 맞춘 응답 타입
```

---

## 도입하지 않은 것

| 안 쓴 것 | 대신 |
|---|---|
| `recharts` 등 차트 라이브러리 | 자체 SVG/CSS. props 모양만 Recharts 와 맞춰 뒀다 |
| `react-hook-form` · `zod` | `useState` + 수동 검증 |
| CSV 라이브러리 | 백엔드가 처리한다 |
| `framer-motion` | `motion` (같은 라이브러리의 현재 이름) |
| `next-navigation-guard` | `beforeunload` + `popstate` + 버튼 핸들러 3계층 |
| `middleware.ts` | 토큰이 localStorage 라 서버에서 읽을 수 없다. `(main)` 클라이언트 레이아웃에서 판정 |

> **`npx shadcn add form` 을 실행하지 않는다.** 이 컴포넌트만 `react-hook-form` 위에 만들어져 있어
> 의존성이 함께 설치된다. 다른 shadcn 컴포넌트는 영향이 없다.

---

## 버전 고정 (올리지 않는다)

- **`next` / `eslint-config-next` 는 `15.5.25` 로 정확히 핀돼 있다.** AWS Amplify Hosting compute 의 SSR 지원 범위가 12~15 이므로, 16 으로 올리면 나중에 배포를 결정했을 때 되돌리는 작업이 생긴다.
- **`typescript` 캐럿 범위를 `^5` 에서 넓히지 않는다.** TypeScript 7 은 프로그래밍 방식 JS API 가 빠져 있어 `npm run lint` 와 `next build` 타입체크가 **둘 다 실패한다.**
- **`npm audit fix --force` 를 쓰지 않는다.** next 15 가 끌고 오는 postcss 취약점을 해소하겠다며 next 를 16 으로 되돌려 버린다.
- shadcn 컴포넌트 추가 시 **`--legacy-peer-deps`** 를 쓴다.

---

## 이 저장소에서 자주 틀리는 것

- **모든 `page.tsx` 에 `"use client"` 를 붙인다.** 서버에는 토큰이 없어 사실상 전부 클라이언트 컴포넌트다.
- **`useSearchParams` 를 쓰는 컴포넌트는 `<Suspense>` 로 감싼다.** 안 그러면 `npm run build` 가 프리렌더에서 실패한다. 개발 서버에서는 통과하므로 늦게 발견된다.
- **동적 라우트 파라미터는 `useParams()` 로 읽는다.** props 의 `params` 는 Promise 다.
- **금액 입력에 `<input type="number">` 를 쓰지 않는다.** 천단위 콤마가 들어가는 순간 값이 빈 문자열이 된다.
- **`toISOString()` 을 쓰지 않는다.** UTC 로 변환되어 날짜가 하루 어긋난다. `date-fns` 의 `format(d, "yyyy-MM-dd")`.
- **거래를 변경하면 `['stats']` 와 `['budgets']` 도 함께 무효화한다.** 놓치면 대시보드 합계가 갱신되지 않는다.
- **`useAuth` 는 토큰 존재 여부가 아니라 `exp` 를 본다.** 만료된 토큰이 판정을 통과하면 보호된 화면이 401 왕복 동안 노출된다.
- **차트는 `src/components/chart/` 밖으로 나가지 않는다.** 화면에서 SVG 를 직접 그리지 않는다.
- **`localStorage` 접근은 전부 `try/catch` 로 감싼다.** 프라이빗 모드·사이트 데이터 차단에서는
  값을 못 주는 게 아니라 **예외를 던진다**. 실패해도 화면은 정상적으로 그려져야 한다.
- **`localStorage` 를 첫 렌더에서 읽지 않는다.** 서버 HTML 에는 없으므로 hydration 이 어긋난다.
  마운트 이후에 넣는다 (`ChatPanel`·`ThemeToggle` 참조).
- **`(main)/layout.tsx` 에 넣는 import 는 여섯 화면이 함께 받는다.** `ChatWidget` 에
  애니메이션 라이브러리를 쓰지 않는 이유다. 레이아웃에 들어가면 비용이 라우트 수만큼 곱해진다.
- **`dangerouslySetInnerHTML` 을 쓰지 않는다.** `category.color` 는 `#RRGGBB` 정규식 검증 후 인라인 스타일에 넣는다.
- **`any` 금지.** 불가피하면 `unknown` + 타입 가드.
- **주석은 한글로 작성한다.** 코드 식별자는 영문.

---

## 디자인

- 폰트 **Pretendard**. Google Fonts 에 없어 `next/font/local` 로 `src/app/fonts/` 에서 로드한다.
- **그림자 대신 1px border 로 면을 구분한다.** 예외는 대시보드 잔액 카드 하나뿐이고, 값은 `--hero-shadow` 토큰 한 곳에만 둔다.
- 테마는 **시스템 / 라이트 / 다크** 셋이고 헤더 버튼 하나가 순환한다. 선택은 `localStorage`(`moneylog_theme`)에 남는다.
  기본값이 "`data-theme` 속성 없음" 이라 대다수 사용자에게는 JS 가 개입하지 않고 CSS 만으로 시스템 설정을 따른다.
- Tailwind 4 는 **CSS-first** 다. `tailwind.config.js` 가 없고 `globals.css` 의 `@theme` 에 토큰을 정의한다.
- 떠 있는 챗봇 창은 **`shadow-md`** 를 쓴다. 「그림자는 모달·드롭다운에만」 규칙이 허용하는 경우이고
  `popover`·`select` 가 이미 같은 값을 쓴다. `--hero-shadow` 는 잔액 카드 전용이며 다크에서 `none` 이다.
- **모바일에서 떠 있는 버튼은 `bottom-20`** 이다. 하단 탭 바가 64px 이라 `bottom-6` 이면 탭 위에 얹힌다.

---

## 커밋

- Conventional Commits: `feat:` `fix:` `refactor:` `test:` `docs:` `chore:` — **본문은 한글**
  (커밋 훅이 없어 형식이 자동 검증되지 않는다. 직접 지킨다)
- 브랜치: `main` ← `develop` ← `feature/{작업명}`
- 백엔드와 **별도 저장소이므로 커밋을 섞지 않는다.**
