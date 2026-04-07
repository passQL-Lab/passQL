Design a full-screen Answer Feedback page for "SQLD Master" SQL study web app, inspired by Duolingo's post-answer experience.

This page REPLACES the question detail screen after the user taps "제출". It is a full page transition, NOT a bottom sheet or modal. Responsive web app (future Electron). Show desktop (1280px, centered 720px) AND mobile (375px) side by side.

Design system: Pretendard, JetBrains Mono for code, #4F46E5 accent.

--- DESIGN TWO VERSIONS ---

=== VERSION 1: CORRECT ANSWER (정답) ===

Subtle green atmosphere — NOT solid green background. White content area with green energy in top section and bottom bar.

Top section (centered, generous vertical space):

- Large ✓ checkmark icon in #DCFCE7 circle, 80px, geometric bold
- "정답입니다!" Pretendard 24px bold #16A34A
- "잘했어요! 다음 문제도 도전해보세요" Pretendard 15px #6B7280
- 32px bottom margin

Middle section (white card, 12px radius, 20px padding):

- "해설" label Pretendard 14px #6B7280
- Correct choice: "A" pill in #DCFCE7/#16A34A green + SQL code block (JetBrains Mono, #F0FDF4 green-tinted code background, 4px #22C55E left border)
- Rationale: Pretendard 15px #374151, line-height 1.7:
  "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다."
- Concept tag pills below: "JOIN", "GROUP BY", "집계함수" in #EEF2FF/#4F46E5

Action row (inside card, subtle):

- "AI 상세 해설 보기" text link #4F46E5
- "유사 문제 추천" text link #4F46E5

Bottom bar (sticky bottom, full-width, #F0FDF4 background, 16px padding):

- Full-width button: "다음 문제" Pretendard 16px bold, white text, #22C55E solid background, 8px radius, 52px height. THE primary action — big and inviting.

=== VERSION 2: WRONG ANSWER (오답) ===

Same structure, red mood:

Top section:

- Large ✗ icon in #FEE2E2 circle, 80px
- "오답입니다" Pretendard 24px bold #DC2626
- "괜찮아요, 해설을 확인해보세요" Pretendard 15px #6B7280

Middle section (white card) — two-part comparison:

Part 1 — "내가 선택한 답":

- #FEF2F2 background section, 4px #EF4444 left border
- "C" pill in #FEE2E2/#DC2626 red + wrong SQL code block (JetBrains Mono)
- Why wrong: Pretendard 14px #374151: "GROUP BY 절에서 별칭 사용이 표준 SQL에서 지원되지 않습니다."

Part 2 — "정답":

- #F0FDF4 background section, 4px #22C55E left border
- "A" pill in #DCFCE7/#16A34A green + correct SQL code block
- Why correct: Pretendard 14px #374151

Subtle divider or spacing between the two parts.

Action row:

- "AI에게 자세히 물어보기" — Primary #4F46E5 button, full width (more prominent for wrong answers)
- "유사 문제로 복습" — Secondary outlined #4F46E5 button

Bottom bar (sticky, #FEF2F2 background):

- "다음 문제" button: white text, #EF4444 solid background, 52px height. Keep momentum even on wrong answers.

--- KEY PRINCIPLES ---

1. Full page commitment — this is a MOMENT, not a popup.
2. "다음 문제" button must be unmissable — largest target, always visible.
3. Wrong answers feel encouraging ("괜찮아요"), not punishing.
4. On desktop, keep 720px max-width centered with generous top margin for dramatic vertical space.
5. Content hierarchy: Result icon → Explanation → Actions → Next button.

Korean text throughout.
