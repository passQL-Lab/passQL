# Markdown 렌더링 설계 — MarkdownText 컴포넌트

## 배경

AI 피드백(PracticeResult AI 리포트), 해설(PracticeFeedbackBar rationale), 문제 지문(QuestionDetail stem) 세 곳에서 Markdown 형식 텍스트를 렌더링해야 한다. 현재 문제 지문은 `ReactMarkdown`으로 처리 중이나 나머지 두 곳은 plain text로 표시되고 있다.

AI 리포트는 단어별 fade-in 애니메이션(`useAiText` 훅)이 적용되어 있는데, 기존 훅은 `innerHTML` 직접 조작 방식이라 ReactMarkdown과 충돌한다.

## 목표

- 세 곳 모두 Markdown 렌더링 지원
- AI 리포트의 단어별 fade-in 애니메이션 유지
- React 방식으로 DOM 조작 없이 구현
- 재사용 가능한 단일 컴포넌트로 통일

## 설계

### 1. MarkdownText 컴포넌트

`src/components/MarkdownText.tsx`에 신규 생성.

```tsx
<MarkdownText text={aiComment} animated />        // AI 리포트 — fade-in O
<MarkdownText text={result.rationale} />           // 해설 — fade-in X
<MarkdownText text={question.stem} className="..." /> // 문제 지문
```

**Props:**
- `text: string` — 렌더링할 Markdown 문자열
- `animated?: boolean` — 단어별 fade-in 여부 (기본값 false)
- `className?: string` — 최상위 래퍼 클래스

**동작:**
- `ReactMarkdown`의 `components` prop으로 `p`, `strong`, `em`, `code`, `pre`, `li` 등 각 요소를 커스텀 컴포넌트로 교체
- `animated=true`이면 각 텍스트 노드를 단어 단위 `<span>`으로 분해하고 CSS `--i` 변수(단어 인덱스)로 `animation-delay` 계산
- `animated=false`이면 정적 Markdown 렌더링만

### 2. useWordFadeIn 훅

`src/hooks/useWordFadeIn.ts`에 신규 생성. 기존 `useAiText`를 대체.

**역할:** 전체 텍스트에서 단어 총 개수를 세어 전역 인덱스 카운터를 관리. MarkdownText 내부에서 각 커스텀 컴포넌트가 이 카운터를 참조해 자신의 단어에 올바른 `--i` 값을 부여.

**구현 방식:**
- `text` prop이 바뀌면 단어 배열을 재계산
- 각 커스텀 컴포넌트는 Context를 통해 현재 인덱스를 읽고 소비
- DOM 직접 조작 없음 — 순수 React state + CSS

### 3. CSS 애니메이션

기존 `ai-word` / `ai-word-visible` 클래스 방식 대신 CSS custom property 방식으로 전환.

```css
.md-word {
  opacity: 0;
  animation: md-fade-in 0.3s ease forwards;
  animation-delay: calc(var(--i) * 55ms + 200ms);
}

@keyframes md-fade-in {
  to { opacity: 1; }
}
```

기존 `ai-word` 클래스는 제거하고 `md-word`로 통일.

### 4. 디자인 시스템 스타일 매핑

각 Markdown 요소 → passQL 디자인 시스템 클래스:

| 요소 | 클래스 |
|------|--------|
| `p` | `text-body leading-relaxed` |
| `strong` | `font-bold` |
| `em` | `italic` |
| `` `code` `` | `bg-surface-code px-1 rounded text-xs font-mono` |
| ` ``` ` 코드블록 | `bg-surface-code rounded-lg px-4 py-3 text-xs font-mono` |
| `ul` / `ol` | `list-disc pl-4 space-y-1` |

### 5. 사용처 변경

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| `PracticeResult.tsx` | `<p ref={aiTextRef} />` + `useAiText` | `<MarkdownText text={aiComment} animated />` |
| `PracticeFeedbackBar.tsx` | `<p>{result.rationale}</p>` | `<MarkdownText text={result.rationale} />` |
| `QuestionDetail.tsx` | `<ReactMarkdown components={...}>` | `<MarkdownText text={question.stem} />` |

`useAiText` 훅은 `MarkdownText`로 완전 대체되므로 삭제.

## 범위 외

- remark/rehype 플러그인 추가 (GFM 테이블, 각주 등) — 현재 AI가 기본 문법만 사용하므로 추가 불필요
- 다크모드 대응 — 프로젝트가 라이트모드 전용이므로 제외
