Design the Home screen of "SQLD Master" SQL study web app.

Responsive web app (future Electron). Show desktop (1280px, centered 720px content) AND mobile (375px) side by side.

Design system: Pretendard for UI, JetBrains Mono for code. Minimalist, #4F46E5 indigo accent, #FAFAFA page background, #FFFFFF card background.

Desktop: Left sidebar navigation (홈 active, #EEF2FF background + #4F46E5 text). Mobile: Bottom tab bar (홈 active, #4F46E5 icon).

Content (same for both breakpoints, single column):

1. Greeting section:
   Left: Geometric avatar — #4F46E5 indigo circle (40px) with white initials "용판".
   Right of avatar: "안녕하세요, 용감한 판다" in Pretendard 22px bold #111827.
   32px bottom margin.

2. "오늘의 문제" card — Full-width, white card, 12px radius, 1px #E5E7EB border, 20px padding.
   Left edge: 4px #4F46E5 left border accent.
   Top: "오늘의 문제" label in Pretendard 14px #6B7280.
   Below: Question stem preview in 1 line, Pretendard 16px #111827, truncated: "고객별 주문 수를 구하는 올바른 SQL은?"
   Right: Chevron-right icon in #9CA3AF.
   Hover: Very subtle #FAFAFA background shift.

3. Streak badge — Standalone row, 16px top margin.
   Rounded-full pill: #FEF3C7 background, #D97706 text, Pretendard 14px bold.
   Content: "🔥 연속 3일"

4. Progress summary — Two cards side by side, 12px gap, 24px top margin.
   Card 1: "42" in Pretendard 28px bold #4F46E5 + "푼 문제" below in 14px #6B7280. White card.
   Card 2: "68%" in Pretendard 28px bold #4F46E5 + "정답률" below in 14px #6B7280. Below the percentage: thin progress bar (68% filled #4F46E5, remaining #E5E7EB), 4px height, rounded-full.

No illustrations, no decorative graphics. Pure content. Korean text throughout. Generous whitespace between sections.
