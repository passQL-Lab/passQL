# Greeting 메시지 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈화면 진입 시 greeting 메시지를 두 줄로 표시하고, 닉네임을 브랜드 색상으로 강조하며, 페이드인+슬라이드업 애니메이션을 적용한다.

**Architecture:** `components.css`에 `greetingIn` keyframe을 추가하고, `Home.tsx`의 greeting 섹션 렌더링 로직을 수정한다. `\n` 기준 split으로 두 줄 렌더링, `{nickname}` 플레이스홀더를 `<span>`으로 치환해 인디고 강조.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, CSS keyframes

---

### Task 1: `greetingIn` keyframe 추가

**Files:**
- Modify: `client/src/styles/components.css:331-339`

- [ ] **Step 1: 기존 slide-up 애니메이션 아래에 greetingIn keyframe과 유틸 클래스 추가**

`client/src/styles/components.css` 파일의 `.animate-slide-up` 블록 바로 아래에 추가:

```css
/* ── Greeting fade-in + slide-up animation ── */
@keyframes greetingIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-greeting {
  animation: greetingIn 0.4s ease-out both;
}

/* 서브 메시지(EXAM_DAY/URGENT)용 딜레이 변형 */
.animate-greeting-delayed {
  animation: greetingIn 0.4s ease-out 80ms both;
}
```

- [ ] **Step 2: 개발 서버에서 CSS 적용 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/client
npm run dev
```

브라우저에서 홈 화면 진입 → greeting 섹션에 아직 클래스가 없으므로 변화 없음 (다음 Task에서 적용)

- [ ] **Step 3: 커밋**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL
git add client/src/styles/components.css
git commit -m "feat: greeting 페이드인 슬라이드업 keyframe 추가 #044"
```

---

### Task 2: Home.tsx greeting 섹션 렌더링 개선

**Files:**
- Modify: `client/src/pages/Home.tsx:49-71`

현재 코드:
```tsx
<section className="mb-6">
  <h1 className="text-h2">
    {greeting
      ? greeting.message.replace("{nickname}", greeting.nickname)
      : `안녕하세요, ${displayName}`}
  </h1>
  {greeting?.messageType === "EXAM_DAY" && (
    <p className="text-sm font-medium mt-1"
       style={{ color: "var(--color-sem-error-text)" }}>
      오늘 시험이에요!
    </p>
  )}
  {greeting?.messageType === "URGENT" && (
    <p className="text-sm font-medium mt-1"
       style={{ color: "var(--color-sem-warning-text)" }}>
      시험이 얼마 남지 않았어요
    </p>
  )}
</section>
```

- [ ] **Step 1: greeting 메시지 파싱 헬퍼 함수 작성**

`Home.tsx` 컴포넌트 함수 위(import 아래)에 추가:

```tsx
/**
 * greeting 메시지의 {nickname}을 강조 span으로 치환하고
 * \n 기준으로 줄을 분리한 ReactNode 배열을 반환한다.
 * 닉네임 강조는 백엔드 플레이스홀더 위치를 그대로 사용 — 프론트 비즈니스 로직 최소화.
 */
function parseGreetingLines(message: string, nickname: string): React.ReactNode[] {
  const lines = message.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split("{nickname}");
    if (parts.length === 1) return <span key={lineIdx}>{line}</span>;
    return (
      <span key={lineIdx}>
        {parts[0]}
        <span
          style={{
            color: "var(--color-brand)",
            fontSize: "1.15em",
            fontWeight: 700,
          }}
        >
          {nickname}
        </span>
        {parts[1]}
      </span>
    );
  });
}
```

- [ ] **Step 2: greeting 섹션 JSX 교체**

`Home.tsx:49-71`의 `<section>` 블록 전체를 아래로 교체:

```tsx
{/* 인사 섹션: animate-greeting으로 페이드인+슬라이드업, \n 두 줄 렌더링, 닉네임 인디고 강조 */}
<section className="mb-6 animate-greeting">
  <h1 className="text-h2 leading-snug">
    {greeting ? (
      parseGreetingLines(greeting.message, greeting.nickname).map((line, i) => (
        <span key={i} className="block">{line}</span>
      ))
    ) : (
      <span>안녕하세요, {displayName}</span>
    )}
  </h1>
  {greeting?.messageType === "EXAM_DAY" && (
    <p
      className="text-sm font-medium mt-1 animate-greeting-delayed"
      style={{ color: "var(--color-sem-error-text)" }}
    >
      오늘 시험이에요!
    </p>
  )}
  {greeting?.messageType === "URGENT" && (
    <p
      className="text-sm font-medium mt-1 animate-greeting-delayed"
      style={{ color: "var(--color-sem-warning-text)" }}
    >
      시험이 얼마 남지 않았어요
    </p>
  )}
</section>
```

- [ ] **Step 3: `--color-brand` 토큰 확인**

```bash
grep -n "color-brand" /Users/suhsaechan/Desktop/Programming/project/passQL/client/src/styles/tokens.css | head -5
```

`--color-brand`가 없으면 `#4F46E5`로 직접 대체:
```tsx
color: "#4F46E5",
```

- [ ] **Step 4: 개발 서버에서 동작 검증**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/client
npm run dev
```

체크리스트:
- [ ] 홈 화면 진입 시 greeting이 아래서 위로 슬라이드되며 나타남
- [ ] 닉네임 텍스트가 인디고 색상 + 살짝 크게 표시됨
- [ ] 백엔드가 `\n` 포함 메시지를 내려줄 경우 두 줄로 분리됨
- [ ] `\n` 없는 메시지(현재 백엔드 미적용 상태)는 한 줄 그대로 표시됨 (fallback 정상)
- [ ] EXAM_DAY/URGENT 서브 메시지가 80ms 딜레이 후 등장

- [ ] **Step 5: 커밋**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL
git add client/src/pages/Home.tsx
git commit -m "feat: 홈화면 greeting 두줄 렌더링, 닉네임 강조, 페이드인 애니메이션 적용 #044"
```

---

### Task 3: 백엔드 greeting 메시지 줄바꿈 적용 (참고 사항)

> **주의:** 이 Task는 백엔드 작업이다. 프론트 구현과 독립적으로 진행 가능. 백엔드 미적용 상태에서도 프론트는 정상 동작(한 줄 표시).

**Files:**
- 백엔드 `GreetingService` 또는 메시지 생성 로직 파일 (경로는 백엔드 담당자 확인 필요)

- [ ] **Step 1: greeting 메시지 템플릿에 `\n` 삽입**

예시 변경 (백엔드 메시지 생성 위치에서):
```
// Before
"{nickname}님, 오늘도 SQL 실력 키우러 오셨군요! 반가워요"

// After
"{nickname}님,\n오늘도 SQL 실력 키우러 오셨군요! 반가워요"
```

모든 messageType(GENERAL, COUNTDOWN, URGENT, EXAM_DAY)의 메시지 템플릿에 동일하게 적용.

- [ ] **Step 2: 백엔드 배포 후 프론트에서 두 줄 표시 최종 확인**

홈 화면 진입 → 닉네임 뒤에서 줄바꿈되어 두 줄로 표시 확인
