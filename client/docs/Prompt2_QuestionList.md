Design the Question List screen of "SQLD Master" SQL study web app.

Responsive web app (future Electron). Show desktop (1280px, centered 720px) AND mobile (375px) side by side.

Design system: Pretendard, JetBrains Mono, minimalist, #4F46E5 accent, #FAFAFA background.

Desktop: Left sidebar (문제 active). Mobile: Bottom tab bar (문제 active).

Content:

1. Filter bar — Top, horizontal row, 16px bottom margin.
   Two pill-shaped dropdowns side by side, 12px gap:
   - "토픽 ▼" — rounded-full, 1px #E5E7EB border, 40px height, Pretendard 14px, chevron icon #9CA3AF.
   - "난이도 ▼" — same style.
     When a filter is active: #4F46E5 border + #EEF2FF background.

2. Result count — Below filters, left-aligned.
   "23문제" in Pretendard 14px #6B7280.

3. Question list — Vertical stack of white cards, 12px gap.
   Each card (12px radius, 1px #E5E7EB border, 20px padding):
   - Top row: "Q001" in JetBrains Mono 12px #9CA3AF (left) + Topic pill "JOIN" in rounded-full #EEF2FF/#4F46E5 12px (right)
   - Middle: Stem preview in Pretendard 16px #111827, 1 line, truncated with ellipsis.
   - Bottom row: Difficulty "★★☆" geometric stars in #F59E0B (left) + chevron-right icon #9CA3AF (right)
   - Hover: subtle #FAFAFA background.

4. Pagination — Bottom center.
   "더 보기" text button in #4F46E5, Pretendard 14px. Or page numbers [1] 2 3 with active in #4F46E5 filled circle white text.

Show 5 cards with varying topics: JOIN, 서브쿼리, GROUP BY, DDL, 제약조건. Varying difficulties.

Clean, scannable. Korean text throughout.
