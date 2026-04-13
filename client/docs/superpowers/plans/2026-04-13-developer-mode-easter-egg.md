# 개발자 모드 Easter Egg 잠금 해제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설정 화면 버전 row를 5번 클릭하면 개발자 모드가 잠금 해제되고, 별도 `/dev` 페이지로 이동하는 메뉴가 나타나도록 구현한다.

**Architecture:** Settings.tsx의 버전 row에 Easter egg 클릭 핸들러를 추가하고, 5번 클릭 시 devUnlocked state가 true가 되어 "개발자 모드" row가 조건부로 노출된다. 클릭하면 `/dev`(DevPage)로 이동하며, DevPage에는 localStorage 초기화 기능이 있다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4 (`@theme` 토큰), lucide-react, React Router DOM v6

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `src/components/SettingsRow.tsx` | 수정 — `onClick` prop 추가 |
| `src/pages/Settings.tsx` | 수정 — Easter egg 로직, devUnlocked state, toast, 조건부 row, 개발자 섹션 제거 |
| `src/pages/DevPage.tsx` | 신규 — 개발자 도구 페이지 (localStorage 초기화 + toast) |
| `src/App.tsx` | 수정 — `/dev` 라우트 등록 |

---

## Task 1: SettingsRow에 onClick prop 추가

**Files:**
- Modify: `src/components/SettingsRow.tsx`

버전 row를 클릭 가능하게 만들기 위해 SettingsRow에 `onClick` prop을 추가한다.
onClick이 있으면 컨테이너가 `cursor-pointer`가 되고 hover 배경이 적용된다.

- [ ] **Step 1: SettingsRow.tsx 수정**

```tsx
import type { ReactNode } from "react";

interface SettingsRowProps {
  readonly label: string;
  readonly value: ReactNode;
  /** 우측 아이콘 버튼 영역 (Copy, RefreshCw 등) */
  readonly action?: ReactNode;
  /** true이면 하단 border 없음 (카드의 마지막 row) */
  readonly isLast?: boolean;
  /** 클릭 핸들러 — 있으면 row 전체가 클릭 가능 */
  readonly onClick?: () => void;
}

/**
 * 설정 카드 내 단일 row
 * - label: 회색 보조 텍스트
 * - value: 메인 콘텐츠 (ReactNode)
 * - action: 우측 아이콘 버튼 (선택사항)
 * - onClick: row 전체 클릭 핸들러 (선택사항)
 */
export default function SettingsRow({ label, value, action, isLast, onClick }: SettingsRowProps) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        isLast ? "" : "border-b border-border"
      } ${onClick ? "cursor-pointer hover:bg-surface active:bg-surface-code transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="text-text-secondary text-sm">{label}</p>
        <div className="mt-0.5">{value}</div>
      </div>
      {action && <div className="ml-3 shrink-0">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/SettingsRow.tsx
git commit -m "feat: SettingsRow onClick prop 추가 #208"
```

---

## Task 2: Settings.tsx Easter egg 로직 구현

**Files:**
- Modify: `src/pages/Settings.tsx`

변경 내용:
1. `devUnlocked` state 추가 (기본 false, 세션 한정)
2. `clickCount` ref 추가 (버전 클릭 카운터)
3. `toastMsg` state + `toastTimerRef` 추가
4. `handleVersionClick` 핸들러 구현
5. 버전 row에 `onClick` + `ChevronRight` 아이콘 연결
6. `devUnlocked` 시 "개발자 모드" row 조건부 노출
7. 기존 개발자 도구 섹션(`⑥`) 제거 (기능은 DevPage로 이동)
8. stagger 인덱스 정리: `s5` 제거(개발자 도구 삭제), `s6` → `s5`(로고)
9. toast JSX 블록 추가

- [ ] **Step 1: Settings.tsx 전체 교체**

```tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, RefreshCw, WifiOff, ChevronRight } from "lucide-react";
import { useMemberStore } from "../stores/memberStore";
import logo from "../assets/logo/logo.png";
import { useRegenerateNickname } from "../hooks/useMember";
import { useStagger } from "../hooks/useStagger";
import { useOnline } from "../hooks/useOnline";
import { useMyFeedback } from "../hooks/useFeedback";
import SettingsSection from "../components/SettingsSection";
import SettingsRow from "../components/SettingsRow";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

export default function Settings() {
  const navigate = useNavigate();
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const truncatedUuid = `${uuid.slice(0, 20)}...`;
  const regenerateMutation = useRegenerateNickname();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = useOnline();
  // 건의사항 섹션 헤더 카운트 pill용 — FeedbackList 내부와 캐시 공유 (dedup)
  const { data: feedbackData } = useMyFeedback();
  const feedbackCount =
    feedbackData && feedbackData.items.length > 0
      ? feedbackData.items.length
      : undefined;

  // 개발자 모드 Easter Egg — 세션 한정 (새로고침 시 리셋)
  const [devUnlocked, setDevUnlocked] = useState(false);
  const clickCountRef = useRef(0);

  // toast 메시지 — null이면 미표시
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 섹션별 순차 페이드인 (50ms 간격)
  const stagger = useStagger();
  const s0 = stagger(0); // h1 "설정"
  const s1 = stagger(1); // 계정 섹션
  const s2 = stagger(2); // 건의사항 입력 카드
  const s3 = stagger(3); // 건의사항 목록 카드
  const s4 = stagger(4); // 앱 정보 섹션
  const s5 = stagger(5); // 로고 + 카피라이트

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  // 버전 row 클릭 — 5번 연속 클릭 시 개발자 모드 잠금 해제
  const handleVersionClick = () => {
    if (devUnlocked) return;
    clickCountRef.current += 1;
    const count = clickCountRef.current;

    if (count === 3) showToast("개발자 모드까지 2번 남았습니다");
    else if (count === 4) showToast("개발자 모드까지 1번 남았습니다");
    else if (count >= 5) {
      setDevUnlocked(true);
      showToast("개발자 모드가 활성화되었습니다");
    }
  };

  return (
    <div className="py-6">
      {/* ① h1 */}
      <section className={s0.className}>
        <h1 className="text-h1 mb-6">설정</h1>
      </section>

      {/* ② 계정 섹션 */}
      <section className={s1.className}>
        <SettingsSection label="계정" isFirst>
          <div className="bg-surface-card border border-border rounded-2xl">
            <SettingsRow
              label="닉네임"
              value={
                <p className="text-body font-bold">{nickname || uuid.slice(0, 8)}</p>
              }
              action={
                <button
                  type="button"
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    regenerateMutation.isPending
                      ? "text-text-caption animate-spin"
                      : "text-text-caption hover:text-brand"
                  }`}
                  title="닉네임 재생성"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  <RefreshCw size={16} />
                </button>
              }
            />
            <SettingsRow
              label="디바이스 ID"
              value={
                <p className="font-mono text-[13px] text-text-primary">{truncatedUuid}</p>
              }
              action={
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
                  title="복사"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check size={16} className="text-sem-success" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              }
              isLast
            />
          </div>
        </SettingsSection>
      </section>

      {/* ③ 건의사항 섹션 헤더 + 입력 카드 */}
      <section className={`mt-6 ${s2.className}`}>
        <SettingsSection label="건의사항" count={feedbackCount}>
          {/* 오프라인 배너 */}
          {/* border-[#FDE68A]: 토큰 없음 — sem-warning-light(#FEF3C7)의 border 버전 없음 */}
          {/* text-[#92400E]: 토큰 없음 — sem-warning-text(#D97706)와 다른 딥 앰버 색상 */}
          {!isOnline && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sem-warning-light border border-[#FDE68A] rounded-xl text-xs text-[#92400E] mb-2.5">
              <WifiOff size={14} className="text-sem-warning-text shrink-0" />
              오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
            </div>
          )}
          <FeedbackForm disabled={!isOnline} />
        </SettingsSection>
      </section>

      {/* ④ 건의사항 목록 카드 */}
      <section className={`mt-3 ${s3.className}`}>
        <FeedbackList disabled={!isOnline} />
      </section>

      {/* ⑤ 앱 정보 섹션 */}
      <section className={`mt-6 ${s4.className}`}>
        <SettingsSection label="앱 정보">
          <div className="bg-surface-card border border-border rounded-2xl">
            <SettingsRow
              label="버전"
              value={<p className="text-caption">{__APP_VERSION__}</p>}
              onClick={devUnlocked ? undefined : handleVersionClick}
              isLast={!devUnlocked}
            />
            {/* 개발자 모드 row — Easter Egg 잠금 해제 시 노출 */}
            {devUnlocked && (
              <SettingsRow
                label="개발자 모드"
                value={<p className="text-caption text-text-secondary">개발자 전용 도구</p>}
                action={<ChevronRight size={16} className="text-text-caption" />}
                onClick={() => navigate("/dev")}
                isLast
              />
            )}
          </div>
        </SettingsSection>
      </section>

      {/* ⑥ 로고 + 카피라이트 */}
      <section className={`text-center mt-8 space-y-2 ${s5.className}`}>
        <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
        <p className="text-xs text-text-caption">© 2026 passQL. All rights reserved.</p>
      </section>

      {/* Toast 알림 — 하단 중앙 고정 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-toast-bg text-white text-sm px-4 py-3 rounded-lg shadow-lg whitespace-nowrap">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: Settings Easter Egg 버전 클릭 개발자 모드 잠금 해제 #208"
```

---

## Task 3: DevPage.tsx 신규 생성

**Files:**
- Create: `src/pages/DevPage.tsx`

개발자 전용 도구 페이지. 뒤로가기 버튼 + localStorage 초기화 기능.
초기화는 2단계 확인 (1차: toast 경고 + 버튼 "진짜요?" 전환, 2차: 실제 삭제).

- [ ] **Step 1: DevPage.tsx 생성**

```tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function DevPage() {
  const navigate = useNavigate();

  // localStorage 초기화 2단계 확인 상태 (실수 방지)
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // toast 메시지 — null이면 미표시
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // 1차 클릭: 경고 toast + "진짜요?" 버튼 전환 (3초 후 자동 복원)
  // 2차 클릭: localStorage 전체 삭제 + 페이지 reload
  const handleClearStorage = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      showToast("초기화하면 풀이 기록, 닉네임이 모두 삭제되고 새 계정으로 시작됩니다. 되돌릴 수 없어요.");
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearTimeout(confirmTimerRef.current!);
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-surface-card">
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-text-primary">개발자 모드</h1>
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
          {/* localStorage 초기화 row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-sem-error shrink-0" />
                <p className="text-sm font-medium text-text-primary">localStorage 초기화</p>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                앱 데이터 전체 삭제 후 재시작
              </p>
            </div>
            <button
              type="button"
              className={`ml-4 shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                confirmClear
                  ? "bg-sem-error-light border-sem-error text-sem-error-text"
                  : "bg-surface-card border-sem-error text-sem-error-text hover:bg-sem-error-light"
              }`}
              onClick={handleClearStorage}
            >
              {confirmClear ? "진짜요?" : "초기화"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast 알림 — 하단 중앙 고정 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-sm">
          <div className="bg-toast-bg text-white text-sm px-4 py-3 rounded-lg shadow-lg text-center">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/pages/DevPage.tsx
git commit -m "feat: 개발자 모드 페이지 신규 생성 #208"
```

---

## Task 4: App.tsx 라우터 등록

**Files:**
- Modify: `src/App.tsx`

`/dev` 라우트를 AppLayout 밖(전체화면 모드)에 추가한다.
DailyChallenge, QuestionDetail 등과 동일한 패턴.

- [ ] **Step 1: App.tsx 수정**

```tsx
import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import CategoryCards from "./pages/CategoryCards";
import DailyChallenge from "./pages/DailyChallenge";
import PracticeSet from "./pages/PracticeSet";
import PracticeResult from "./pages/PracticeResult";
import QuestionDetail from "./pages/QuestionDetail";
import AnswerFeedback from "./pages/AnswerFeedback";
import RecommendationPractice from "./pages/RecommendationPractice";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import DevPage from "./pages/DevPage";
import { ensureRegistered } from "./stores/memberStore";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "questions", element: <CategoryCards /> },
      { path: "stats", element: <Stats /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  // AppLayout 밖: 전체화면 몰입형 화면 (문제 풀이는 집중 모드)
  {
    path: "questions/:questionUuid",
    element: <QuestionDetail />,
  },
  {
    path: "daily-challenge",
    element: <DailyChallenge />,
  },
  {
    path: "questions/:questionUuid/result",
    element: <AnswerFeedback />,
  },
  {
    path: "practice/:sessionId",
    element: <PracticeSet />,
  },
  {
    path: "practice/:sessionId/result",
    element: <PracticeResult />,
  },
  // 홈 추천 문제 — DailyChallenge 패턴의 단건 풀이 모드
  {
    path: "recommendation/:questionUuid",
    element: <RecommendationPractice />,
  },
  // 개발자 전용 도구 (Easter Egg 잠금 해제 후 접근)
  {
    path: "dev",
    element: <DevPage />,
  },
]);

export default function App() {
  useEffect(() => {
    ensureRegistered();
  }, []);

  return <RouterProvider router={router} />;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: 개발자 모드 Easter Egg 잠금 해제 구현 완료 #208"
```

---

## 셀프 리뷰 체크리스트

- [x] **스펙 커버리지**: 버전 row 5번 클릭 Easter egg, 3/4/5번 toast 피드백, devUnlocked 세션 한정, 개발자 모드 row 조건부 노출, `/dev` 페이지 이동, localStorage 초기화 경고 toast — 전부 구현됨
- [x] **플레이스홀더 없음**: TBD/TODO 없음, 모든 단계에 실제 코드 포함
- [x] **타입 일관성**: `showToast(msg: string)`, `handleVersionClick()`, `handleClearStorage()` — 태스크 간 시그니처 일치
- [x] **인라인 CSS 없음**: 모든 스타일은 Tailwind 유틸리티 클래스 또는 프로젝트 토큰(`bg-toast-bg`, `text-sem-error` 등) 사용
- [x] **이모지 없음**: 코드에 이모지 미사용, lucide-react 아이콘만 사용
