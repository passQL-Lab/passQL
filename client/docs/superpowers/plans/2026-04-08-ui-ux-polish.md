# UI/UX Polish — 토스 원칙 기반 개선 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 토스 UX 심리학 법칙 + 라이팅 원칙을 기반으로 전체 화면의 레이아웃, 텍스트, 디자인 규칙 위반을 수정한다.

**Architecture:** HIGH 4건 + MEDIUM 4건을 2개 Task로 묶어 진행. Task 1은 구조/규칙 위반(shadow, 유니코드, 순서), Task 2는 UX 라이팅 + 피드백 개선.

**Tech Stack:** React 19, Tailwind CSS 4, lucide-react

---

### Task 1: 구조 개선 + 디자인 규칙 위반 수정

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Questions.tsx`
- Modify: `src/pages/Stats.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Home.tsx — CTA 순서 변경 + 인사말 간소화**

"문제 풀기" 카드를 인사말 바로 아래로 이동 (스트릭 뱃지보다 위). 인사말 아바타 유지하되 간결하게.

변경 순서: 인사말 → 문제 풀기 CTA → 스트릭 뱃지 → 통계 카드

- [ ] **Step 2: Questions.tsx — 페이지 제목 추가 + shadow 제거 + 유니코드 제거**

필터 위에 `<h1 className="text-h1 mb-4">문제</h1>` 추가.
드롭다운에서 `shadow-lg` 제거.
난이도 필터에서 `"★".repeat(d)` → StarRating 컴포넌트 사용.

- [ ] **Step 3: Stats.tsx — 페이지 제목 추가**

상단에 `<h1 className="text-h1 mb-6">학습 통계</h1>` 추가.

- [ ] **Step 4: Settings.tsx — 페이지 제목 추가**

상단에 `<h1 className="text-h1 mb-6">설정</h1>` 추가.

- [ ] **Step 5: 빌드 + 테스트 확인**

Run: `npm run build && npm test`

- [ ] **Step 6: Commit**

```bash
git add src/pages/Home.tsx src/pages/Questions.tsx src/pages/Stats.tsx src/pages/Settings.tsx
git commit -m "fix: UI/UX 구조 개선 (CTA 순서, 페이지 제목, shadow/유니코드 제거) #20"
```

---

### Task 2: UX 라이팅 + 피드백 개선

**Files:**
- Modify: `src/pages/QuestionDetail.tsx`
- Modify: `src/pages/AnswerFeedback.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: QuestionDetail.tsx — 제출 버튼 텍스트 + 문제 번호**

제출 버튼: "제출" → "답안 제출하기"
헤더에 문제 번호 추가: `Q{id.padStart(3, "0")}` 뱃지 토픽 옆에.

- [ ] **Step 2: AnswerFeedback.tsx — 라이팅 개선**

정답: "잘했어요! 다음 문제도 도전해보세요" → "정확히 맞혔어요! 다음 문제도 도전해보세요"
오답: "괜찮아요, 해설을 확인해보세요" → "다음엔 맞출 수 있어요. 해설을 확인해보세요"

- [ ] **Step 3: Settings.tsx — 복사 피드백**

복사 버튼 클릭 시 아이콘을 `Copy` → `Check`로 2초간 변경 후 복원. (토스트 대신 인라인 피드백)

- [ ] **Step 4: 빌드 + 테스트 확인**

Run: `npm run build && npm test`

- [ ] **Step 5: Commit**

```bash
git add src/pages/QuestionDetail.tsx src/pages/AnswerFeedback.tsx src/pages/Settings.tsx
git commit -m "fix: UX 라이팅 개선 + 복사 피드백 추가 #20"
```
