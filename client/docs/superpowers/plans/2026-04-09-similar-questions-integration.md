# 미연동 API 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AnswerFeedback 결과 화면에 `fetchSimilar` API를 연동하여 유사 문제 추천 섹션을 추가한다. (`fetchTags`, `fetchExamSchedules`는 대응 UI가 없으므로 이번 범위에서 제외)

**Architecture:** React Query 훅 `useSimilarQuestions`를 생성하고, AnswerFeedback 페이지 하단(해설 카드 아래, 하단 버튼 위)에 유사 문제 카드 목록을 렌더링한다. API 실패 시 섹션 자체를 숨긴다.

**Tech Stack:** React 19, TypeScript, @tanstack/react-query, Tailwind CSS, lucide-react

---

## File Structure

| 파일 | 역할 | 작업 |
|------|------|------|
| `src/hooks/useSimilarQuestions.ts` | fetchSimilar React Query 훅 | Create |
| `src/pages/AnswerFeedback.tsx` | 유사 문제 섹션 추가 | Modify |

기존 파일 (변경 없음):
- `src/api/ai.ts` — `fetchSimilar(questionUuid, k)` 이미 존재
- `src/types/api.ts` — `SimilarQuestion { questionUuid, stem, topicName, score }` 이미 정의됨

---

### Task 1: useSimilarQuestions 훅 생성

**Files:**
- Create: `src/hooks/useSimilarQuestions.ts`

- [ ] **Step 1: 훅 파일 생성**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchSimilar } from "../api/ai";

export function useSimilarQuestions(questionUuid: string, k = 3) {
  return useQuery({
    queryKey: ["similarQuestions", questionUuid, k],
    queryFn: () => fetchSimilar(questionUuid, k),
    enabled: !!questionUuid,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

---

### Task 2: AnswerFeedback 페이지에 유사 문제 섹션 추가

**Files:**
- Modify: `src/pages/AnswerFeedback.tsx`

api-guide 스펙: "유사 문제: GET /ai/similar/{questionUuid}?k=3 (P1, 옵션)"
Design.md: card-base, badge-topic, StarRating, ChevronRight — 홈 추천 문제 섹션과 동일 패턴.

- [ ] **Step 1: import 추가**

```typescript
import { Check, X, ChevronRight } from "lucide-react";  // ChevronRight 추가
import { Link } from "react-router-dom";  // Link는 이미 import되어 있으면 확인
import { StarRating } from "../components/StarRating";
import { useSimilarQuestions } from "../hooks/useSimilarQuestions";
```

- [ ] **Step 2: useSimilarQuestions 훅 호출 추가**

컴포넌트 내부, diffMutation 아래에 추가:

```typescript
const similarQuery = useSimilarQuestions(state?.questionUuid ?? "");
```

주의: `state`가 null일 수 있으므로 `state?.questionUuid ?? ""`로 전달. `enabled: !!questionUuid` 조건으로 빈 문자열이면 쿼리 실행 안 됨.

- [ ] **Step 3: 유사 문제 섹션 JSX 추가**

`AiExplanationSheet` 컴포넌트 바로 위 (line 159 부근, `</div>` 닫기 직전)에 추가:

```tsx
{similarQuery.data && similarQuery.data.length > 0 && (
  <section className="mt-6 mx-auto max-w-180 w-full px-4">
    <h2 className="text-secondary text-sm mb-3">유사 문제</h2>
    <div className="space-y-2">
      {similarQuery.data.map((q) => (
        <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`}>
          <div className="card-base flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-body truncate">{q.stem}</p>
              <span className="badge-topic">{q.topicName}</span>
            </div>
            <ChevronRight size={16} className="text-text-caption flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  </section>
)}
```

위치: 정답/오답 해설 카드 아래, AiExplanationSheet 위. 정답이든 오답이든 모두 표시.

---

### Task 3: 빌드 검증 및 커밋

- [ ] **Step 1: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 성공

- [ ] **Step 2: 테스트 실행**

Run: `npx vitest run`
Expected: 모든 테스트 통과

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useSimilarQuestions.ts src/pages/AnswerFeedback.tsx
git commit -m "feat: 결과 화면에 유사 문제 추천 섹션 추가 #41"
```
