# 건의사항 채팅 스타일 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 건의사항 페이지를 "폼+목록 카드" 2단 구조에서 채팅/버블 스타일로 전면 교체한다.

**Architecture:** 기존 SubpageLayout 헤더를 유지하면서 콘텐츠 영역을 `flex-1 overflow-hidden flex-col` 구조로 전환한다. FeedbackList가 채팅 버블 목록(스크롤)을 담당하고 FeedbackForm이 하단 고정 입력 영역을 담당한다. 상태(PENDING/REVIEWED/APPLIED)는 버블 색상으로만 구분하며 시스템 메시지는 없다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, lucide-react, @tanstack/react-query

---

## 파일 변경 범위

| 파일 | 역할 |
|------|------|
| `src/components/SubpageLayout.tsx` | `fullHeight` prop 추가 — 채팅형 페이지의 `h-screen flex-col` 레이아웃 지원 |
| `src/components/FeedbackItem.tsx` | 버블 컴포넌트로 전면 교체 + `toDateKey` 유틸 export |
| `src/components/FeedbackForm.tsx` | 채팅 스타일 하단 고정 입력 영역으로 전면 교체 |
| `src/components/FeedbackList.tsx` | 날짜 구분선 포함 버블 목록 + 빈 상태/스켈레톤으로 전면 교체 |
| `src/pages/SettingsFeedback.tsx` | `fullHeight` + `p-0` 레이아웃으로 교체 |

---

## Task 1: SubpageLayout — fullHeight 모드 추가

**Files:**
- Modify: `src/components/SubpageLayout.tsx`

- [ ] **Step 1: fullHeight prop 추가**

`src/components/SubpageLayout.tsx` 전체를 아래로 교체한다:

```tsx
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface SubpageLayoutProps {
  readonly title: string;
  readonly children: ReactNode;
  /** 콘텐츠 영역 추가 클래스 (예: "space-y-3") */
  readonly contentClassName?: string;
  /**
   * 채팅형 레이아웃 전용 — true 시 페이지 전체가 h-screen flex-col으로 전환.
   * 콘텐츠 영역이 flex-1 overflow-hidden flex flex-col p-0 으로 설정된다.
   * contentClassName 은 이 경우에도 추가 클래스로 병합된다.
   */
  readonly fullHeight?: boolean;
}

/**
 * 탭바 없는 서브페이지 공통 레이아웃
 * - ArrowLeft 뒤로가기 헤더 + 콘텐츠 영역
 * - AppLayout 밖 독립 라우트 전용 (DevPage, SettingsFeedback 등)
 * - fullHeight=true: 채팅형 전체 화면 레이아웃 (h-screen, 하단 고정 입력 지원)
 */
export default function SubpageLayout({
  title,
  children,
  contentClassName,
  fullHeight = false,
}: SubpageLayoutProps) {
  const navigate = useNavigate();

  const outerClass = fullHeight
    ? "h-screen flex flex-col overflow-hidden bg-surface"
    : "min-h-screen bg-surface";

  const contentClass = fullHeight
    ? `flex-1 overflow-hidden flex flex-col${contentClassName ? ` ${contentClassName}` : ""}`
    : `py-6 px-4${contentClassName ? ` ${contentClassName}` : ""}`;

  return (
    <div className={outerClass}>
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-border bg-surface-card">
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      </div>

      {/* 콘텐츠 */}
      <div className={contentClass}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: 커밋**

```bash
git add src/components/SubpageLayout.tsx
git commit -m "refactor: SubpageLayout fullHeight 모드 추가 (채팅형 레이아웃 지원) #229"
```

---

## Task 2: FeedbackItem.tsx — 버블 컴포넌트 교체

**Files:**
- Modify: `src/components/FeedbackItem.tsx`

- [ ] **Step 1: FeedbackItem.tsx 전면 교체**

```tsx
import type { FeedbackItem as FeedbackItemType, FeedbackStatus } from "../types/api";

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  PENDING: "대기",
  REVIEWED: "확인됨",
  APPLIED: "반영됨",
};

/**
 * ISO 8601 → 버블 내부 표시용 상대 시간
 * 오늘/어제/N일 전/N주 전 (7일 이상은 절대 날짜)
 */
function formatBubbleTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "방금";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "오늘";
  if (hours < 48) return "어제";
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  return `${weeks}주 전`;
}

/**
 * ISO 8601 → "YYYY-MM-DD" 날짜 키 (날짜 구분선 비교용)
 * FeedbackList에서 import해서 사용한다.
 */
export function toDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

interface FeedbackItemProps {
  readonly item: FeedbackItemType;
  /** FeedbackList에서 주입하는 stagger 애니메이션 클래스 */
  readonly className?: string;
}

/**
 * 건의사항 단일 버블
 * - 오른쪽 정렬, 하단에 날짜 + 상태 pill
 * - PENDING: 인디고 solid / REVIEWED: 인디고 연한 / APPLIED: 그린 연한
 */
export default function FeedbackItem({ item, className }: FeedbackItemProps) {
  const { status } = item;

  // 버블 배경+텍스트
  const bubbleClass =
    status === "PENDING"
      ? "bg-brand text-white"
      : status === "REVIEWED"
      ? "bg-brand-light border border-[#C7D2FE] text-text-primary"
      : "bg-sem-success-light border border-[#BBF7D0] text-text-primary";

  // 상태 pill
  const pillClass =
    status === "PENDING"
      ? "bg-white/20 text-white"
      : status === "REVIEWED"
      ? "bg-brand text-white"
      : "bg-sem-success-text text-white";

  // 시간 색상
  const timeClass = status === "PENDING" ? "text-white/60" : "text-text-caption";

  return (
    <div className={`flex justify-end${className ? ` ${className}` : ""}`}>
      <div
        className={`max-w-[82%] px-3 py-2.5 rounded-[16px_16px_3px_16px] text-[11.5px] leading-snug ${bubbleClass}`}
      >
        {/* 본문 */}
        <p className="mb-1.5 break-words">{item.content}</p>
        {/* 메타: 시간 + 상태 pill */}
        <div className="flex items-center justify-end gap-1.5">
          <span className={`text-[8.5px] ${timeClass}`}>
            {formatBubbleTime(item.createdAt)}
          </span>
          <span
            className={`text-[8px] font-semibold px-1.5 py-px rounded-full ${pillClass}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: 커밋**

```bash
git add src/components/FeedbackItem.tsx
git commit -m "refactor: FeedbackItem 버블 스타일로 전면 교체 #229"
```

---

## Task 3: FeedbackForm.tsx — 채팅 입력 영역 교체

**Files:**
- Modify: `src/components/FeedbackForm.tsx`

- [ ] **Step 1: FeedbackForm.tsx 전면 교체**

```tsx
import { useState } from "react";
import { Send, AlertTriangle } from "lucide-react";
import { useSubmitFeedback } from "../hooks/useFeedback";

const MAX_LENGTH = 500;

interface FeedbackFormProps {
  /** 오프라인 상태일 때 true — textarea + 버튼 비활성 */
  readonly disabled?: boolean;
}

/**
 * 건의사항 하단 고정 입력 영역
 * - textarea wrap: 포커스 시 보더 인디고
 * - 1자 이상 입력 시 보내기 버튼 활성
 * - 전송 실패 시 인라인 에러 배너 + 재시도 버튼
 */
export default function FeedbackForm({ disabled = false }: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const mutation = useSubmitFeedback();

  const isValid = content.length >= 1 && content.length <= MAX_LENGTH;
  const isDisabled = disabled || !isValid || mutation.isPending;

  const handleSubmit = () => {
    if (!isValid || mutation.isPending) return;
    mutation.mutate(content, { onSuccess: () => setContent("") });
  };

  const handleRetry = () => {
    if (!isValid || mutation.isPending) return;
    mutation.reset();
    mutation.mutate(content, { onSuccess: () => setContent("") });
  };

  return (
    <div className="shrink-0 border-t border-border bg-surface-card px-3 pt-2.5 pb-4">
      {/* textarea wrap */}
      <div
        className={`bg-surface border rounded-xl px-3 pt-2.5 pb-2 transition-colors ${
          mutation.isPending ? "border-border" : "border-border focus-within:border-brand"
        }`}
      >
        <textarea
          className="w-full min-h-[52px] resize-none border-none outline-none bg-transparent text-[11.5px] text-text-primary leading-relaxed placeholder:text-text-caption disabled:cursor-not-allowed"
          placeholder="앱에 바라는 점을 자유롭게 적어주세요"
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) setContent(e.target.value);
          }}
          disabled={disabled || mutation.isPending}
          rows={2}
        />
        {/* 하단 푸터: 글자수 + 보내기 버튼 */}
        <div className="flex items-center justify-between border-t border-surface-code pt-2 mt-1">
          <span className="text-[9.5px] text-text-caption tabular-nums">
            <span className={content.length > 0 ? "text-brand font-semibold" : ""}>
              {content.length}
            </span>
            {" / "}{MAX_LENGTH}
          </span>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              isDisabled
                ? "bg-border text-text-caption cursor-not-allowed"
                : "bg-brand text-white"
            }`}
            disabled={isDisabled}
            onClick={handleSubmit}
          >
            보내기
            <Send size={11} />
          </button>
        </div>
      </div>

      {/* 전송 실패 인라인 에러 */}
      {mutation.isError && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-sem-error-light border border-[#FCA5A5] rounded-lg text-[10px] text-sem-error-text">
          <AlertTriangle size={12} className="shrink-0" />
          <span className="flex-1">전송에 실패했어요</span>
          <button
            type="button"
            className="bg-white border border-[#FCA5A5] text-sem-error-text px-2 py-1 rounded-md text-[9.5px] font-bold"
            onClick={handleRetry}
          >
            재시도
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: 커밋**

```bash
git add src/components/FeedbackForm.tsx
git commit -m "refactor: FeedbackForm 채팅 입력 영역으로 전면 교체 #229"
```

---

## Task 4: FeedbackList.tsx — 채팅 목록 교체

**Files:**
- Modify: `src/components/FeedbackList.tsx`

- [ ] **Step 1: FeedbackList.tsx 전면 교체**

API는 `createdAt` 내림차순(최신 먼저) 반환 → 화면은 오래된 것이 위, 최신이 아래이므로 `[...items].reverse()` 처리한다.

```tsx
import { Fragment } from "react";
import { MessageSquare } from "lucide-react";
import FeedbackItem, { toDateKey } from "./FeedbackItem";
import ErrorFallback from "./ErrorFallback";
import { useMyFeedback } from "../hooks/useFeedback";
import { useStagger } from "../hooks/useStagger";

interface FeedbackListProps {
  /** 오프라인 상태일 때 true — ErrorFallback(network) 표시 */
  readonly disabled?: boolean;
}

/** ISO 8601 → 날짜 구분선 표시 텍스트 */
function getDateLabel(isoString: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(isoString).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${Math.floor(diffDays / 7)}주 전`;
}

/** 날짜 구분선 */
function DateDivider({ date }: { readonly date: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[9.5px] text-text-caption whitespace-nowrap">
        {getDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/** 로딩 중 버블 스켈레톤 */
function BubbleSkeleton({ widthClass }: { readonly widthClass: string }) {
  return (
    <div className="flex justify-end">
      <div
        className={`h-14 rounded-[16px_16px_3px_16px] bg-surface-code animate-pulse ${widthClass}`}
      />
    </div>
  );
}

/**
 * 건의사항 채팅 버블 목록
 * - API 반환값(최신순)을 뒤집어 오래된 것이 위, 최신이 아래로 표시
 * - 날짜가 바뀌는 지점에 DateDivider 삽입
 * - 로딩: 스켈레톤 2개 / 빈 상태: EmptyState / 에러: ErrorFallback
 */
export default function FeedbackList({ disabled = false }: FeedbackListProps) {
  const { data, isError, isLoading, refetch } = useMyFeedback();
  const stagger = useStagger();

  // 오프라인 또는 조회 에러
  if (disabled || isError) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <ErrorFallback
          errorType={disabled ? "network" : "server"}
          onRetry={disabled ? undefined : () => refetch()}
        />
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-end gap-2.5 px-3.5 py-4">
        <BubbleSkeleton widthClass="w-[65%]" />
        <BubbleSkeleton widthClass="w-[75%]" />
      </div>
    );
  }

  // 빈 상태
  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 gap-2 text-center">
        <div className="w-11 h-11 rounded-xl bg-surface-code flex items-center justify-center mb-1">
          <MessageSquare size={20} className="text-text-caption" />
        </div>
        <p className="text-[12px] font-semibold text-text-secondary">
          아직 보낸 건의가 없어요
        </p>
        <p className="text-[11px] text-text-caption leading-relaxed">
          궁금한 점이나 원하는 기능을
          <br />
          자유롭게 남겨주세요
        </p>
      </div>
    );
  }

  // API는 최신순(desc) 반환 → 화면은 오래된 것 위, 최신 것 아래
  const sorted = [...items].reverse();

  return (
    <div className="flex-1 flex flex-col gap-2.5 px-3.5 py-4 overflow-y-auto">
      {sorted.map((item, idx) => {
        const showDivider =
          idx === 0 ||
          toDateKey(item.createdAt) !== toDateKey(sorted[idx - 1].createdAt);
        return (
          <Fragment key={item.feedbackUuid}>
            {showDivider && <DateDivider date={item.createdAt} />}
            <FeedbackItem item={item} className={stagger(idx).className} />
          </Fragment>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Step 3: 커밋**

```bash
git add src/components/FeedbackList.tsx
git commit -m "refactor: FeedbackList 채팅 버블 목록 + 날짜 구분선으로 전면 교체 #229"
```

---

## Task 5: SettingsFeedback.tsx — 페이지 레이아웃 교체

**Files:**
- Modify: `src/pages/SettingsFeedback.tsx`

- [ ] **Step 1: SettingsFeedback.tsx 교체**

```tsx
import { WifiOff } from "lucide-react";
import { useOnline } from "../hooks/useOnline";
import SubpageLayout from "../components/SubpageLayout";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

/**
 * 건의사항 서브페이지 — 채팅 스타일 레이아웃
 * - SubpageLayout fullHeight=true: h-screen flex-col, 헤더 고정
 * - FeedbackList: flex-1 overflow-y-auto (버블 목록 스크롤)
 * - FeedbackForm: shrink-0 하단 고정 입력 영역
 */
export default function SettingsFeedback() {
  const isOnline = useOnline();

  return (
    <SubpageLayout title="건의사항" fullHeight>
      {/* 오프라인 배너 */}
      {!isOnline && (
        <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 bg-sem-warning-light border-b border-[#FDE68A] text-[10.5px] text-[#92400E]">
          <WifiOff size={13} className="text-sem-warning-text shrink-0" />
          오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
        </div>
      )}
      {/* 채팅 버블 목록 (스크롤) */}
      <FeedbackList disabled={!isOnline} />
      {/* 하단 고정 입력 */}
      <FeedbackForm disabled={!isOnline} />
    </SubpageLayout>
  );
}
```

- [ ] **Step 2: 최종 빌드 확인**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in`

- [ ] **Step 3: 최종 커밋**

```bash
git add src/pages/SettingsFeedback.tsx
git commit -m "feat: 건의사항 페이지 채팅 스타일 리디자인 완료 #229"
```
