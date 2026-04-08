# API Docs Sync — be-api-docs.json 업데이트 반영 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 업데이트된 be-api-docs.json(v0.0.3)을 기반으로 Member API 연동, execute body 키 수정, AI 타입 강화, api-guide 문서 동기화를 수행한다.

**Architecture:** 타입 정의 → API 함수 → memberStore 리팩토링 → api-guide 문서 업데이트 순서로 진행. 타입을 먼저 정의하여 이후 작업에서 타입 안전성을 확보한다.

**Tech Stack:** TypeScript, Zustand, apiFetch 래퍼

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/types/api.ts` | Member 응답 타입 + AI payload 타입 추가 |
| Create | `src/api/members.ts` | register, fetchMe, regenerateNickname 함수 |
| Modify | `src/api/questions.ts` | executeChoice body 키 수정 (choiceKey → sql) |
| Modify | `src/api/ai.ts` | 느슨한 Record 타입 → 구체적 payload 타입 |
| Modify | `src/stores/memberStore.ts` | register API 연동, nickname 상태 추가 |
| Modify | `.claude/rules/api-guide.md` | Members 구현 상태 + execute body 키 + diff-explain 스펙 |

---

### Task 1: 타입 정의 추가

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: Member 응답 타입 + AI payload 타입 추가**

`src/types/api.ts` 파일 끝에 다음을 추가한다:

```typescript
// === Member ===
export interface MemberRegisterResponse {
  readonly memberUuid: string;
  readonly nickname: string;
}

export interface MemberMeResponse {
  readonly memberUuid: string;
  readonly nickname: string;
  readonly role: string;
  readonly status: string;
  readonly isTestAccount: boolean;
  readonly createdAt: string;
  readonly lastSeenAt: string;
}

export interface NicknameRegenerateResponse {
  readonly nickname: string;
}

// === AI Payloads ===
export interface ExplainErrorPayload {
  readonly questionId: number;
  readonly sql: string;
  readonly errorMessage: string;
}

export interface DiffExplainPayload {
  readonly questionId: number;
  readonly selectedKey: string;
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: Member 응답 타입 + AI payload 타입 추가 #13"
```

---

### Task 2: members.ts API 함수 생성 + executeChoice 수정 + ai.ts 타입 강화

**Files:**
- Create: `src/api/members.ts`
- Modify: `src/api/questions.ts`
- Modify: `src/api/ai.ts`

- [ ] **Step 1: `src/api/members.ts` 생성**

```typescript
import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type {
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
} from "../types/api";

export function register(): Promise<MemberRegisterResponse> {
  return apiFetch("/members/register", { method: "POST" });
}

export function fetchMe(): Promise<MemberMeResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/members/me?memberUuid=${uuid}`);
}

export function regenerateNickname(): Promise<NicknameRegenerateResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/members/me/regenerate-nickname?memberUuid=${uuid}`, {
    method: "POST",
  });
}
```

- [ ] **Step 2: `src/api/questions.ts` — executeChoice body 수정**

현재:
```typescript
export function executeChoice(
  id: number,
  choiceKey: string,
): Promise<ExecuteResult> {
  return apiFetch(`/questions/${id}/execute`, {
    method: "POST",
    body: JSON.stringify({ choiceKey }),
  });
}
```

변경:
```typescript
export function executeChoice(
  id: number,
  sql: string,
): Promise<ExecuteResult> {
  return apiFetch(`/questions/${id}/execute`, {
    method: "POST",
    body: JSON.stringify({ sql }),
  });
}
```

- [ ] **Step 3: `src/api/ai.ts` — 구체적 타입 적용**

현재:
```typescript
export function explainError(payload: Record<string, unknown>): Promise<AiResult> {
```

변경:
```typescript
import type { AiResult, SimilarQuestion, ExplainErrorPayload, DiffExplainPayload } from "../types/api";

export function explainError(payload: ExplainErrorPayload): Promise<AiResult> {
  return apiFetch("/ai/explain-error", {
    method: "POST",
    headers: { "X-User-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}

export function diffExplain(payload: DiffExplainPayload): Promise<AiResult> {
  return apiFetch("/ai/diff-explain", {
    method: "POST",
    headers: { "X-User-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`

주의: `executeChoice`의 인자가 `choiceKey → sql`로 바뀌므로 호출부(QuestionDetail, useQuestionDetail, ChoiceCard)에서 빌드 에러 발생 가능. 호출부도 함께 수정해야 함.

`src/hooks/useQuestionDetail.ts`에서:
```typescript
// 현재: mutationFn: (choiceKey: string) => executeChoice(questionId, choiceKey)
// 변경 필요 없음 — 호출부(QuestionDetail)에서 choice.body를 전달하도록 수정
```

`src/pages/QuestionDetail.tsx`에서 `handleExecute` 호출 시:
```typescript
// 현재: executeMutation.mutate(choiceKey, ...)
// 변경: choice.body (SQL 문자열)를 전달해야 함
```

이 변경은 QuestionDetail의 handleExecute + ChoiceCard의 onExecute props를 통해 전달되므로, useQuestionDetail 훅의 mutationFn 인자를 `sql: string`으로 변경하고, QuestionDetail에서 `handleExecute(choice.body)`로 호출, ChoiceCard에서도 `onExecute(choice.body)`로 전달해야 한다.

`src/hooks/useQuestionDetail.ts` 변경:
```typescript
export function useExecuteChoice(questionId: number) {
  return useMutation({
    mutationFn: (sql: string) => executeChoice(questionId, sql),
  });
}
```

`src/pages/QuestionDetail.tsx` 변경 — handleExecute에서 choiceKey 대신 sql 전달:
```typescript
const handleExecute = useCallback((choiceKey: string, sql: string) => {
  if (executeCacheRef.current[choiceKey]) return;
  executeMutation.mutate(sql, {
    onSuccess: (result) => {
      setExecuteCache((prev) => ({ ...prev, [choiceKey]: result }));
    },
  });
}, [executeMutation]);

const handleSelect = useCallback((choiceKey: string, sql: string) => {
  setSelectedKey(choiceKey);
  if (!executeCacheRef.current[choiceKey]) {
    handleExecute(choiceKey, sql);
  }
}, [handleExecute]);
```

ChoiceCard props에서:
```typescript
onSelect: (key: string, sql: string) => void;
onExecute: (key: string, sql: string) => void;
```

ChoiceCard 내부에서:
```tsx
onClick={() => onSelect(choice.key, choice.body)}
onClick={() => onExecute(choice.key, choice.body)}
```

QuestionDetail에서 ChoiceCard 호출:
```tsx
<ChoiceCard
  ...
  onSelect={handleSelect}
  onExecute={handleExecute}
/>
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/api/members.ts src/api/questions.ts src/api/ai.ts src/hooks/useQuestionDetail.ts src/pages/QuestionDetail.tsx src/components/ChoiceCard.tsx
git commit -m "feat: Member API 함수 + executeChoice body 수정(sql) + AI 타입 강화 #13"
```

---

### Task 3: memberStore 리팩토링 — register API 연동

**Files:**
- Modify: `src/stores/memberStore.ts`

- [ ] **Step 1: memberStore에 register 연동 + nickname 상태 추가**

첫 진입 시 localStorage에 UUID가 없으면 `register()` 호출하여 서버에서 UUID + 닉네임 발급. 있으면 기존 UUID 사용.

```typescript
import { create } from "zustand";
import { register } from "../api/members";

const STORAGE_KEY = "passql_member_uuid";
const NICKNAME_KEY = "passql_nickname";

interface MemberState {
  readonly uuid: string;
  readonly nickname: string;
  readonly isRegistering: boolean;
  readonly setNickname: (nickname: string) => void;
}

function getStoredUuid(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getStoredNickname(): string {
  return localStorage.getItem(NICKNAME_KEY) ?? "";
}

export const useMemberStore = create<MemberState>()((set) => ({
  uuid: getStoredUuid() ?? "",
  nickname: getStoredNickname(),
  isRegistering: false,
  setNickname: (nickname: string) => {
    localStorage.setItem(NICKNAME_KEY, nickname);
    set({ nickname });
  },
}));

export function getMemberUuid(): string {
  return useMemberStore.getState().uuid;
}

export async function ensureRegistered(): Promise<void> {
  const { uuid } = useMemberStore.getState();
  if (uuid) return;

  useMemberStore.setState({ isRegistering: true });
  try {
    const result = await register();
    localStorage.setItem(STORAGE_KEY, result.memberUuid);
    localStorage.setItem(NICKNAME_KEY, result.nickname);
    useMemberStore.setState({
      uuid: result.memberUuid,
      nickname: result.nickname,
      isRegistering: false,
    });
  } catch {
    const fallbackUuid = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, fallbackUuid);
    useMemberStore.setState({
      uuid: fallbackUuid,
      isRegistering: false,
    });
  }
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/stores/memberStore.ts
git commit -m "feat: memberStore register API 연동 + nickname 상태 추가 #13"
```

---

### Task 4: api-guide.md 문서 동기화

**Files:**
- Modify: `.claude/rules/api-guide.md`

- [ ] **Step 1: Members 섹션 구현 상태 업데이트**

Members 테이블에서 `미구현` → `O`로 변경. 응답 타입도 업데이트:
- `register()` → `MemberRegisterResponse`
- `fetchMe()` → `MemberMeResponse` (query param: memberUuid)
- `regenerateNickname()` → `NicknameRegenerateResponse` (query param: memberUuid)

- [ ] **Step 2: executeChoice 설명 수정**

`executeChoice(id, choiceKey)` → `executeChoice(id, sql)` 로 변경. body: `{ sql: "SELECT ..." }`.

- [ ] **Step 3: diff-explain body 스펙 업데이트**

백엔드 프록시 기준 body: `{ questionId, selectedKey }` (나머지는 백엔드가 보강).

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/api-guide.md
git commit -m "docs: api-guide Members 구현 상태 + execute/diff-explain body 스펙 업데이트 #13"
```
