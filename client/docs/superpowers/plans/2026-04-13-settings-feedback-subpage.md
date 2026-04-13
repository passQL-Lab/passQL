# 건의사항 서브페이지 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settings.tsx에서 FeedbackForm/FeedbackList를 제거하고 `/settings/feedback` 독립 서브페이지로 분리한다.

**Architecture:** AppLayout 밖 독립 라우트(`/settings/feedback`)를 추가하여 탭바 없는 몰입형 화면으로 구성. DevPage 패턴 동일 (ArrowLeft 헤더 + `navigate(-1)`). Settings.tsx는 건의사항 SettingsRow 하나만 남긴다.

**Tech Stack:** React 19, React Router DOM, Tailwind CSS 4, lucide-react

---

## 파일 맵

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/pages/SettingsFeedback.tsx` | **신규** | 건의사항 서브페이지 (헤더 + 오프라인 배너 + FeedbackForm + FeedbackList) |
| `src/App.tsx` | **수정** | `/settings/feedback` 독립 라우트 추가 |
| `src/pages/Settings.tsx` | **수정** | 건의사항 섹션 → SettingsRow + ChevronRight, 관련 import 제거, stagger 재번호 |

---

## Task 1: SettingsFeedback.tsx 신규 생성

**Files:**
- Create: `src/pages/SettingsFeedback.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, WifiOff } from "lucide-react";
import { useOnline } from "../hooks/useOnline";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

/**
 * 건의사항 서브페이지
 * - AppLayout 밖 독립 라우트 (/settings/feedback)
 * - 탭바 없는 몰입형 화면 — DevPage 패턴 동일
 */
export default function SettingsFeedback() {
  const navigate = useNavigate();
  const isOnline = useOnline();

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
        <h1 className="text-base font-semibold text-text-primary">건의사항</h1>
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
        {/* 오프라인 배너 */}
        {!isOnline && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sem-warning-light border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
            <WifiOff size={14} className="text-sem-warning-text shrink-0" />
            오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
          </div>
        )}
        <FeedbackForm disabled={!isOnline} />
        <FeedbackList disabled={!isOnline} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/pages/SettingsFeedback.tsx
git commit -m "feat: SettingsFeedback 서브페이지 신규 생성 #209"
```

---

## Task 2: App.tsx — /settings/feedback 라우트 추가

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import 추가 및 라우트 등록**

`src/App.tsx`에서 `DevPage` import 아래에 추가:

```tsx
import SettingsFeedback from "./pages/SettingsFeedback";
```

그리고 라우터 배열에서 `dev` 라우트 아래에 추가:

```tsx
  // 건의사항 서브페이지 — AppLayout 밖 독립 라우트 (탭바 없는 몰입형)
  {
    path: "settings/feedback",
    element: <SettingsFeedback />,
  },
```

- [ ] **Step 2: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: /settings/feedback 독립 라우트 추가 #209"
```

---

## Task 3: Settings.tsx — 건의사항 섹션 교체

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: import 정리**

제거할 import 3줄:
```tsx
import { useMyFeedback } from "../hooks/useFeedback";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";
```

`useOnline` import도 제거 (Settings에서 더 이상 사용 안 함):
```tsx
import { useOnline } from "../hooks/useOnline";
```

`WifiOff` 아이콘도 lucide import에서 제거:
```tsx
// 변경 전
import { Copy, Check, RefreshCw, WifiOff, ChevronRight } from "lucide-react";
// 변경 후
import { Copy, Check, RefreshCw, ChevronRight } from "lucide-react";
```

- [ ] **Step 2: 상태/변수 제거**

아래 코드 블록 제거:
```tsx
const isOnline = useOnline();
// 건의사항 섹션 헤더 카운트 pill용 — FeedbackList 내부와 캐시 공유 (dedup)
const { data: feedbackData } = useMyFeedback();
const feedbackCount =
  feedbackData && feedbackData.items.length > 0
    ? feedbackData.items.length
    : undefined;
```

- [ ] **Step 3: stagger 재번호**

기존 6단계(s0~s5)에서 건의사항 2개(s2, s3) 제거 → 5단계로:

```tsx
// 변경 전
const s0 = stagger(0); // h1 "설정"
const s1 = stagger(1); // 계정 섹션
const s2 = stagger(2); // 건의사항 입력 카드
const s3 = stagger(3); // 건의사항 목록 카드
const s4 = stagger(4); // 앱 정보 섹션
const s5 = stagger(5); // 로고 + 카피라이트

// 변경 후
const s0 = stagger(0); // h1 "설정"
const s1 = stagger(1); // 계정 섹션
const s2 = stagger(2); // 건의사항 row
const s3 = stagger(3); // 앱 정보 섹션
const s4 = stagger(4); // 로고 + 카피라이트
```

- [ ] **Step 4: JSX — 건의사항 섹션 교체**

기존 건의사항 섹션 2개(`③`, `④`)를 아래로 교체:

```tsx
      {/* ③ 건의사항 섹션 — 서브페이지 진입 row */}
      <section className={`mt-6 ${s2.className}`}>
        <SettingsSection label="건의사항">
          <div className="bg-surface-card border border-border rounded-2xl">
            <SettingsRow
              label="건의사항"
              value={<p className="text-body font-medium">의견 남기기</p>}
              action={<ChevronRight size={16} className="text-text-caption" />}
              onClick={() => navigate("/settings/feedback")}
              isLast
            />
          </div>
        </SettingsSection>
      </section>
```

- [ ] **Step 5: JSX — 뒤따르는 섹션 stagger 번호 업데이트**

앱 정보 섹션: `s4.className` → `s3.className`
로고+카피라이트 섹션: `s5.className` → `s4.className`

- [ ] **Step 6: 커밋**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: 건의사항 섹션 SettingsRow로 교체 및 import 정리 #209"
```

---

## Task 4: 브라우저 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 체크리스트**

- [ ] `/settings` 접근 → 건의사항 row + ChevronRight 표시
- [ ] 건의사항 row 클릭 → `/settings/feedback` 이동, 탭바 없음
- [ ] 뒤로가기 버튼 → `/settings` 복귀
- [ ] 오프라인 상태 시 배너 표시 (브라우저 네트워크 탭에서 오프라인 설정)
- [ ] FeedbackForm 입력 및 제출 정상 동작
- [ ] FeedbackList 목록 정상 표시
