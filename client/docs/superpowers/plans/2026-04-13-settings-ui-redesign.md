# Settings UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설정 화면을 계정/건의사항/앱 정보 3개 섹션으로 재구성하고, 건의사항 제출·조회 기능을 추가한다 (백엔드 API 미구현 → graceful fallback 처리).

**Architecture:** `SettingsSection` / `SettingsRow` UI 인프라 컴포넌트를 먼저 추출하고, Feedback API 클라이언트 → React Query 훅 → FeedbackForm / FeedbackList / FeedbackItem 순서로 바텀업 빌드. Settings.tsx는 마지막에 조합. `useOnline` 훅으로 오프라인 상태를 감지하고 배너 + 컴포넌트 disabled 처리.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, TanStack Query v5, lucide-react, Zustand, apiFetch<T> 래퍼

---

## File Structure

**Create:**
- `src/api/feedback.ts` — submitFeedback / fetchMyFeedback API 클라이언트
- `src/hooks/useFeedback.ts` — useMyFeedback (query) / useSubmitFeedback (mutation)
- `src/hooks/useOnline.ts` — navigator.onLine 감지 훅
- `src/components/SettingsSection.tsx` — 섹션 헤더 (label + count pill) + children 래퍼
- `src/components/SettingsRow.tsx` — row 단위 (label / value / action 아이콘 버튼)
- `src/components/FeedbackItem.tsx` — 단일 건의사항 row (pill + content + time)
- `src/components/FeedbackForm.tsx` — textarea + 카운터 + 보내기 버튼 + 인라인 에러
- `src/components/FeedbackList.tsx` — 건의사항 목록 + 빈 상태 + 에러 분기

**Modify:**
- `src/types/api.ts` — FeedbackStatus / FeedbackItem / FeedbackListResponse / FeedbackSubmitResponse 타입 추가
- `src/pages/Settings.tsx` — 3섹션 구조 + stagger 0~5 재할당 + 오프라인 처리

---

## Task 1: Feedback 타입 정의

**Files:**
- Modify: `src/types/api.ts` (끝에 추가)

- [ ] **Step 1: api.ts 끝에 Feedback 타입 블록 추가**

```typescript
// src/types/api.ts 끝에 추가 (기존 PracticeAnalysis 다음)

// === Feedback ===
export type FeedbackStatus = "PENDING" | "REVIEWED" | "APPLIED";

export interface FeedbackItem {
  readonly feedbackUuid: string;
  readonly content: string;
  readonly status: FeedbackStatus;
  readonly createdAt: string; // ISO 8601
}

export interface FeedbackListResponse {
  readonly items: readonly FeedbackItem[];
}

export interface FeedbackSubmitResponse {
  readonly feedbackUuid: string;
  readonly status: FeedbackStatus;
  readonly createdAt: string;
}
```

- [ ] **Step 2: 타입 에러 없는지 빌드 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/types/api.ts
git commit -m "feat: Feedback API 타입 정의 추가 (FeedbackStatus / FeedbackItem / Response) #198"
```

---

## Task 2: Feedback API 클라이언트

**Files:**
- Create: `src/api/feedback.ts`

- [ ] **Step 1: `src/api/feedback.ts` 생성**

```typescript
import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { FeedbackListResponse, FeedbackSubmitResponse } from "../types/api";

/**
 * POST /feedback
 * 건의사항 제출 — body: { content }, 헤더: X-Member-UUID
 */
export async function submitFeedback(content: string): Promise<FeedbackSubmitResponse> {
  return apiFetch<FeedbackSubmitResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify({ content }),
    headers: { "X-Member-UUID": getMemberUuid() },
  });
}

/**
 * GET /feedback/me
 * 내 건의사항 목록 조회 — 헤더: X-Member-UUID
 */
export async function fetchMyFeedback(): Promise<FeedbackListResponse> {
  return apiFetch<FeedbackListResponse>("/feedback/me", {
    headers: { "X-Member-UUID": getMemberUuid() },
  });
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/api/feedback.ts
git commit -m "feat: Feedback API 클라이언트 추가 (submitFeedback / fetchMyFeedback) #198"
```

---

## Task 3: React Query 훅

**Files:**
- Create: `src/hooks/useFeedback.ts`

- [ ] **Step 1: `src/hooks/useFeedback.ts` 생성**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyFeedback, submitFeedback } from "../api/feedback";
import { ApiError } from "../api/client";
import type { FeedbackListResponse } from "../types/api";

// API 미구현(404) 시 빈 배열로 graceful fallback
const EMPTY_LIST: FeedbackListResponse = { items: [] };

/**
 * 내 건의사항 목록 쿼리
 * - API 미구현(404) → EMPTY_LIST fallback (섹션 유지, 빈 상태 표시)
 * - 그 외 에러 → throw (ErrorFallback 렌더링)
 */
export function useMyFeedback() {
  return useQuery({
    queryKey: ["feedback", "my"],
    queryFn: async () => {
      try {
        return await fetchMyFeedback();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return EMPTY_LIST;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2, // 2분
    retry: false,
  });
}

/**
 * 건의사항 제출 mutation
 * - 성공 시 목록 캐시 무효화 → 자동 refetch
 */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", "my"] });
    },
  });
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useFeedback.ts
git commit -m "feat: useFeedback 훅 추가 (useMyFeedback / useSubmitFeedback) #198"
```

---

## Task 4: useOnline 훅

**Files:**
- Create: `src/hooks/useOnline.ts`

- [ ] **Step 1: `src/hooks/useOnline.ts` 생성**

```typescript
import { useState, useEffect } from "react";

/**
 * 네트워크 온/오프라인 상태를 감지하는 훅
 * online/offline 이벤트 리스너로 실시간 토글
 */
export function useOnline(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useOnline.ts
git commit -m "feat: useOnline 훅 추가 (네트워크 상태 실시간 감지) #198"
```

---

## Task 5: SettingsSection + SettingsRow 컴포넌트

**Files:**
- Create: `src/components/SettingsSection.tsx`
- Create: `src/components/SettingsRow.tsx`

- [ ] **Step 1: `src/components/SettingsSection.tsx` 생성**

```typescript
import type { ReactNode } from "react";

interface SettingsSectionProps {
  readonly label: string;
  /** 의미 있는 카운트가 있을 때만 인디고 pill 표시 (undefined / 0 → 숨김) */
  readonly count?: number;
  readonly children: ReactNode;
  /** true이면 mt-0 (페이지 첫 섹션), false/undefined이면 mt-6 */
  readonly isFirst?: boolean;
  readonly className?: string;
}

/**
 * 설정 페이지 섹션 헤더 래퍼
 * - 좌측: text-text-secondary 라벨
 * - 우측: count가 있으면 인디고 pill (홈 화면 패턴과 동일)
 */
export default function SettingsSection({
  label,
  count,
  children,
  isFirst,
  className,
}: SettingsSectionProps) {
  return (
    <div className={`${isFirst ? "" : "mt-6"} ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-2 px-0.5">
        <span className="text-text-secondary text-sm font-medium">{label}</span>
        {!!count && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-brand-light text-brand rounded-full text-[11px] font-bold">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: `src/components/SettingsRow.tsx` 생성**

```typescript
import type { ReactNode } from "react";

interface SettingsRowProps {
  readonly label: string;
  readonly value: ReactNode;
  /** 우측 아이콘 버튼 영역 (Copy, RefreshCw 등) */
  readonly action?: ReactNode;
  /** true이면 하단 border 없음 (카드의 마지막 row) */
  readonly isLast?: boolean;
}

/**
 * 설정 카드 내 단일 row
 * - label: 회색 보조 텍스트
 * - value: 메인 콘텐츠 (ReactNode)
 * - action: 우측 아이콘 버튼 (선택사항)
 */
export default function SettingsRow({ label, value, action, isLast }: SettingsRowProps) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        isLast ? "" : "border-b border-border"
      }`}
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

- [ ] **Step 3: 타입 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/SettingsSection.tsx src/components/SettingsRow.tsx
git commit -m "feat: SettingsSection / SettingsRow 공용 컴포넌트 추가 #198"
```

---

## Task 6: FeedbackItem 컴포넌트

**Files:**
- Create: `src/components/FeedbackItem.tsx`

- [ ] **Step 1: `src/components/FeedbackItem.tsx` 생성**

```typescript
import { useStagger } from "../hooks/useStagger";
import type { FeedbackItem as FeedbackItemType, FeedbackStatus } from "../types/api";

// 상태별 pill 디자인 설정 (기존 디자인 토큰 사용)
const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING:  { label: "대기",   bg: "bg-sem-warning-light", text: "text-sem-warning-text", dot: "bg-[#D97706]" },
  REVIEWED: { label: "확인됨", bg: "bg-brand-light",       text: "text-brand",            dot: "bg-brand"    },
  APPLIED:  { label: "반영됨", bg: "bg-sem-success-light", text: "text-sem-success-text", dot: "bg-[#16A34A]" },
};

/** ISO 8601 문자열 → "방금 / N분 전 / N시간 전 / N일 전 / N주 전" */
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

interface FeedbackItemProps {
  readonly item: FeedbackItemType;
  /** 목록 내 위치 인덱스 — useStagger 순차 페이드인에 사용 */
  readonly index: number;
}

/**
 * 건의사항 단일 row
 * - 상단: 상태 pill + 상대 시간
 * - 하단: 본문 텍스트
 * - useStagger로 목록 진입 시 순차 페이드인
 */
export default function FeedbackItem({ item, index }: FeedbackItemProps) {
  const stagger = useStagger();
  const s = stagger(index);
  const config = STATUS_CONFIG[item.status];

  return (
    <div
      className={`px-4 py-3.5 border-b border-[#F3F4F6] last:border-b-0 hover:bg-surface transition-colors ${s.className}`}
    >
      {/* 상단: 상태 pill + 시간 */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
          {config.label}
        </span>
        <span className="text-[11px] text-text-caption">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>

      {/* 하단: 본문 */}
      <p className="text-[13.5px] text-text-primary leading-snug">{item.content}</p>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/FeedbackItem.tsx
git commit -m "feat: FeedbackItem 컴포넌트 추가 (상태 pill + 상대 시간 + stagger 애니메이션) #198"
```

---

## Task 7: FeedbackForm 컴포넌트

**Files:**
- Create: `src/components/FeedbackForm.tsx`

- [ ] **Step 1: `src/components/FeedbackForm.tsx` 생성**

```typescript
import { useState } from "react";
import { Edit3, Send, AlertTriangle } from "lucide-react";
import { useSubmitFeedback } from "../hooks/useFeedback";

const MAX_LENGTH = 500;

interface FeedbackFormProps {
  /** 오프라인 상태일 때 true — textarea + 버튼 비활성 */
  readonly disabled?: boolean;
}

/**
 * 건의사항 입력 카드
 * - 헤더: ✎ 아이콘 + "의견 보내기" + 보조 문구
 * - textarea: focus 시 카드 보더 → 인디고 (focus-within CSS)
 * - 푸터: 글자수 카운터 + 보내기 버튼 (1~500자 입력 시 활성)
 * - 에러: Soft fill (A안) — 배경색 only, 왼쪽 굵은 보더 없음
 */
export default function FeedbackForm({ disabled = false }: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const mutation = useSubmitFeedback();

  const isValid = content.length >= 1 && content.length <= MAX_LENGTH;
  const isDisabled = disabled || !isValid || mutation.isPending;

  const handleSubmit = () => {
    if (!isValid || mutation.isPending) return;
    mutation.mutate(content, {
      onSuccess: () => setContent(""),
    });
  };

  const handleRetry = () => {
    if (!isValid) return;
    mutation.reset();
    mutation.mutate(content);
  };

  return (
    <div className="border border-border rounded-2xl bg-surface-card focus-within:border-brand transition-colors px-[18px] py-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
          <Edit3 size={14} />
        </span>
        <span className="text-[13px] font-semibold text-text-primary">의견 보내기</span>
        <span className="text-[11px] text-text-caption ml-auto">백엔드 팀이 직접 확인해요</span>
      </div>

      {/* Textarea — 보더 없음, transparent bg, focus outline 없음 */}
      <textarea
        className="w-full min-h-16 resize-none border-none outline-none bg-transparent text-sm text-text-primary leading-relaxed placeholder:text-text-caption disabled:cursor-not-allowed"
        placeholder="앱에 바라는 점을 자유롭게 적어주세요"
        value={content}
        onChange={(e) => {
          if (e.target.value.length <= MAX_LENGTH) setContent(e.target.value);
        }}
        disabled={disabled || mutation.isPending}
        rows={3}
      />

      {/* 푸터: 카운터 + 보내기 버튼 */}
      <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-2.5 mt-2.5">
        <span className="text-[11px] text-text-caption tabular-nums">
          {/* 1자 이상이면 카운터 숫자만 인디고 강조 */}
          <span className={content.length > 0 ? "text-brand font-semibold" : ""}>
            {content.length}
          </span>
          {" / "}
          {MAX_LENGTH}
        </span>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isDisabled
              ? "bg-border text-text-caption cursor-not-allowed"
              : "bg-brand text-white"
          }`}
          disabled={isDisabled}
          onClick={handleSubmit}
        >
          보내기
          <Send size={12} />
        </button>
      </div>

      {/* 제출 실패 인라인 에러 — A: Soft fill (왼쪽 굵은 보더 없음) */}
      {mutation.isError && (
        <div className="flex items-center gap-2.5 mt-2.5 px-3.5 py-2.5 bg-sem-error-light rounded-lg text-xs text-sem-error-text">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="flex-1">전송에 실패했어요</span>
          <button
            type="button"
            className="bg-white border border-[#FCA5A5] text-sem-error-text px-2.5 py-1 rounded-md text-[11px] font-bold"
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

- [ ] **Step 2: 타입 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/FeedbackForm.tsx
git commit -m "feat: FeedbackForm 컴포넌트 추가 (textarea + 카운터 + 제출 에러 A안) #198"
```

---

## Task 8: FeedbackList 컴포넌트

**Files:**
- Create: `src/components/FeedbackList.tsx`

- [ ] **Step 1: `src/components/FeedbackList.tsx` 생성**

```typescript
import { Edit3 } from "lucide-react";
import FeedbackItem from "./FeedbackItem";
import ErrorFallback from "./ErrorFallback";
import { useMyFeedback } from "../hooks/useFeedback";

interface FeedbackListProps {
  /** 오프라인 상태일 때 true — ErrorFallback(network, 재시도 버튼 없음) 표시 */
  readonly disabled?: boolean;
}

/**
 * 건의사항 목록 카드
 * - 로딩: 스켈레톤 2행
 * - 오프라인 / API 에러: ErrorFallback (network / server 타입)
 * - 빈 상태: ✎ 아이콘 + 안내 문구 (카드 유지, 섹션 레이아웃 흔들림 방지)
 * - 정상: FeedbackItem 목록 (useStagger 순차 페이드인)
 */
export default function FeedbackList({ disabled = false }: FeedbackListProps) {
  const { data, isError, isLoading, refetch } = useMyFeedback();

  // 오프라인 또는 에러 — ErrorFallback 표시
  if (disabled || isError) {
    return (
      <ErrorFallback
        errorType={disabled ? "network" : "server"}
        onRetry={disabled ? undefined : () => refetch()}
      />
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
      {isLoading ? (
        // 스켈레톤 로딩
        <div className="animate-pulse">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="px-4 py-3.5 border-b border-[#F3F4F6] last:border-b-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-16 bg-[#F3F4F6] rounded-full" />
                <div className="h-3 w-10 bg-[#F3F4F6] rounded" />
              </div>
              <div className="h-3.5 w-3/4 bg-[#F3F4F6] rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        // 빈 상태 — 카드 숨기지 않고 안내 문구 표시
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <span className="w-11 h-11 rounded-xl bg-[#F3F4F6] text-text-caption flex items-center justify-center mb-2.5">
            <Edit3 size={18} />
          </span>
          <p className="text-[13px] text-text-secondary mb-1">아직 보낸 건의가 없어요</p>
          <p className="text-[11px] text-text-caption">첫 의견을 들려주세요</p>
        </div>
      ) : (
        // 목록 — 각 item은 useStagger로 순차 페이드인
        items.map((item, index) => (
          <FeedbackItem key={item.feedbackUuid} item={item} index={index} />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/FeedbackList.tsx
git commit -m "feat: FeedbackList 컴포넌트 추가 (목록 + 빈 상태 + 스켈레톤 + 에러 분기) #198"
```

---

## Task 9: Settings.tsx 재구성

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Settings.tsx 전체 교체**

```typescript
import { useState, useRef, useEffect } from "react";
import { Copy, Check, RefreshCw, WifiOff } from "lucide-react";
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
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const truncatedUuid = `${uuid.slice(0, 20)}...`;
  const regenerateMutation = useRegenerateNickname();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const isOnline = useOnline();
  // 건의사항 섹션 헤더 카운트 pill용 — FeedbackList 내부와 캐시 공유 (dedup)
  const { data: feedbackData } = useMyFeedback();
  const feedbackCount = feedbackData?.items.length || undefined;

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
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
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
              value={
                <p className="text-caption text-sm text-text-caption">{__APP_VERSION__}</p>
              }
              isLast
            />
          </div>
        </SettingsSection>
      </section>

      {/* ⑥ 로고 + 카피라이트 */}
      <section className={`text-center mt-8 space-y-2 ${s5.className}`}>
        <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
        <p className="text-xs text-text-caption">© 2026 passQL. All rights reserved.</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 전체 빌드 통과 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run build
```
Expected: `✓ built in` — 에러 없음

- [ ] **Step 3: 개발 서버에서 수동 검증**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run dev
```

확인 항목:
- [ ] 페이지 진입 시 stagger 0→5 순차 페이드인
- [ ] 계정 카드: 닉네임(위) → 디바이스ID(아래) 순서, 각 아이콘 버튼 동작
- [ ] 입력 카드: textarea focus 시 카드 보더 인디고 전환
- [ ] 카운터: 0자일 때 버튼 disabled(회색), 1자 이상 active(인디고)
- [ ] 500자 초과 시 입력 차단
- [ ] 건의사항 목록: 빈 상태 카드 표시 (섹션 사라지지 않음)
- [ ] 버전 정보 표시
- [ ] 로고 + 카피라이트 하단 표시

- [ ] **Step 4: 커밋**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: 설정 화면 3섹션 재구성 (계정/건의사항/앱 정보) + stagger 0~5 #198"
```

---

## Task 10: 개발자 도구 섹션

**Files:**
- Modify: `src/pages/Settings.tsx`

개발 중 모바일에서 localStorage를 직접 건드리기 어렵기 때문에 설정 화면에 다크 터미널 스타일 개발자 섹션을 추가한다. 두 번 클릭 확인 패턴으로 실수 방지.

- [ ] **Step 1: import 변경 없음**

Task 9의 Settings.tsx import 그대로 사용 (`Copy, Check, RefreshCw, WifiOff`). 추가 import 불필요.

- [ ] **Step 2: confirmClear 상태 + ref + 핸들러 추가**

Settings() 함수 안, `const isOnline = useOnline();` 바로 아래에 추가:

```typescript
// localStorage 초기화 2단계 확인 상태 (실수 방지)
const [confirmClear, setConfirmClear] = useState(false);
const confirmTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

// 1차 클릭: 확인 상태로 전환 (3초 후 자동 복원)
// 2차 클릭: localStorage 전체 삭제 + 페이지 reload
const handleClearStorage = () => {
  if (!confirmClear) {
    setConfirmClear(true);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
    return;
  }
  clearTimeout(confirmTimerRef.current!);
  localStorage.clear();
  window.location.reload();
};
```

- [ ] **Step 3: useEffect 클린업에 confirmTimerRef 추가**

기존 cleanup useEffect를 찾아 아래처럼 수정:

```typescript
useEffect(() => {
  return () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
  };
}, []);
```

- [ ] **Step 4: stagger 인덱스 재할당 — s5=개발자, s6=로고**

기존:
```typescript
const s5 = stagger(5); // 로고 + 카피라이트
```
변경 후:
```typescript
const s5 = stagger(5); // 개발자 도구 섹션
const s6 = stagger(6); // 로고 + 카피라이트
```

- [ ] **Step 5: 앱 정보 섹션 아래 + 로고 위에 개발자 도구 섹션 JSX 삽입**

`{/* ⑤ 앱 정보 섹션 */}` 블록 끝난 바로 다음, `{/* ⑦ 로고 + 카피라이트 */}` 바로 앞에 삽입.

디자인: 기존 계정/앱 정보 카드와 완전 동일한 스타일(`SettingsSection` + `bg-surface-card border border-border rounded-2xl`). 우측 버튼만 빨간색으로 파괴성 표시. 2단계 확인 패턴으로 실수 방지.

```tsx
{/* ⑥ 개발자 도구 섹션 */}
<section className={`mt-6 ${s5.className}`}>
  <SettingsSection label="개발자">
    <div className="bg-surface-card border border-border rounded-2xl">
      <SettingsRow
        label="localStorage 초기화"
        value={
          <p className="text-sm text-text-secondary">앱 데이터 전체 삭제 후 재시작</p>
        }
        action={
          <button
            type="button"
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              confirmClear
                ? "bg-sem-error-light border-[#FCA5A5] text-sem-error-text"
                : "bg-white border-[#FCA5A5] text-sem-error-text hover:bg-sem-error-light"
            }`}
            onClick={handleClearStorage}
          >
            {confirmClear ? "진짜요?" : "초기화"}
          </button>
        }
        isLast
      />
    </div>
  </SettingsSection>
</section>
```

- [ ] **Step 6: 로고 섹션 stagger를 `s6`으로 교체**

기존:
```tsx
<section className={`text-center mt-8 space-y-2 ${s5.className}`}>
```
변경 후:
```tsx
<section className={`text-center mt-8 space-y-2 ${s6.className}`}>
```

- [ ] **Step 7: 빌드 통과 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run build
```
Expected: 에러 없음

- [ ] **Step 8: 개발 서버에서 동작 확인**

- [ ] 개발자 섹션이 다크 터미널 스타일로 표시됨
- [ ] `$ clear` 버튼 첫 클릭 → "진짜요?" 빨간색으로 전환
- [ ] 3초 내 다시 클릭 → localStorage 삭제 + 페이지 reload
- [ ] 3초 지나면 버튼 `$ clear`로 복원

- [ ] **Step 9: 커밋**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: 개발자 도구 섹션 추가 (localStorage.clear + 2단계 확인) #198"
```

---

## Task 12: 최종 빌드 검증

- [ ] **Step 1: 프로덕션 빌드 통과**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run build
```
Expected: `✓ built in` — tsc + vite 모두 통과

- [ ] **Step 2: 검증 체크리스트 최종 확인**

- [ ] `npm run build` 통과 (tsc + vite)
- [ ] 모바일 375px / 데스크톱 1280px 레이아웃 깨짐 없음
- [ ] stagger 애니메이션 0~5 순차 페이드인
- [ ] 입력 카드 focus 시 보더 인디고 전환 (focus-within CSS)
- [ ] 카운터 0일 때 버튼 disabled, 1자 이상 active
- [ ] 500자 초과 시 입력 막힘
- [ ] API 미구현(404) 시 빈 상태 카드 — 섹션 유지
- [ ] 모든 텍스트 한국어, 모든 아이콘 lucide-react (이모지 0)
- [ ] 인라인 style 속성 0

---

## Self-Review

### Spec Coverage 확인

| 스펙 항목 | 구현 Task |
|-----------|-----------|
| 섹션 헤더 (계정/건의사항/앱 정보) | Task 5 (SettingsSection), Task 9 (Settings.tsx) |
| 계정 카드 닉네임 재생성 | Task 9 (Settings.tsx) |
| 계정 카드 디바이스 ID 복사 | Task 9 (Settings.tsx) |
| FeedbackForm (textarea + 카운터 + 버튼) | Task 7 |
| FeedbackList (목록 + 빈 상태) | Task 8 |
| FeedbackItem (pill + content + time) | Task 6 |
| 상태 pill 3종 (대기/확인됨/반영됨) | Task 6 |
| 제출 에러 A: Soft fill | Task 7 |
| 오프라인 배너 + form disabled | Task 4 (useOnline), Task 9 |
| 오프라인 시 FeedbackList ErrorFallback | Task 8 |
| 목록 에러 시 ErrorFallback | Task 8 |
| API 404 → 빈 배열 graceful fallback | Task 3 (useFeedback) |
| stagger 0~5 순차 페이드인 | Task 9 |
| FeedbackItem 내부 stagger (0~N) | Task 6 |
| 앱 정보 섹션 | Task 9 |
| 로고 + 카피라이트 | Task 9 |
| 개발자 도구 섹션 (localStorage.clear + 2단계 확인) | Task 10 |
| React Query 캐시 invalidate on submit | Task 3 |

### 타입 일관성

- `FeedbackItem` — `src/types/api.ts` 정의 → Task 6, 8에서 임포트 ✓
- `FeedbackStatus` — Task 1 정의 → Task 6에서 `STATUS_CONFIG` 키 타입으로 사용 ✓
- `useMyFeedback()` — Task 3 정의 → Task 8, Task 9에서 호출 ✓
- `useSubmitFeedback()` — Task 3 정의 → Task 7에서 호출 ✓
- `useOnline()` — Task 4 정의 → Task 9에서 호출 ✓
- `SettingsSection` props (`label`, `count?`, `isFirst?`) — Task 5 정의 → Task 9에서 사용 ✓
- `SettingsRow` props (`label`, `value`, `action?`, `isLast?`) — Task 5 정의 → Task 9에서 사용 ✓
