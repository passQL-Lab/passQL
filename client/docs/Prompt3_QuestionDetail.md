Design the Question Detail screen of "SQLD Master" SQL study web app. THIS IS THE MOST IMPORTANT SCREEN.

Responsive web app (future Electron). Show desktop (1280px, centered 720px) AND mobile (375px) side by side.

Design system: Pretendard UI, JetBrains Mono for SQL, #4F46E5 accent.

Desktop: Left sidebar (collapsed or hidden to maximize content space). Mobile: No bottom tab bar — replaced by header with back arrow.

Layout — Single column, scrollable:

1. Header (sticky top, 56px, white background, bottom 1px #E5E7EB border):
   - Left: ← back arrow icon #111827
   - Right: Topic pill "JOIN" (#EEF2FF/#4F46E5) + Difficulty "★★☆" badge

2. Stem Card (white card, 12px radius, 20px padding):
   "다음 SQL 중 고객별 주문 수를 올바르게 구하는 것은?"
   Pretendard 16px #111827. No decoration.

3. Schema Card (collapsible, 12px top margin):
   Header row: "스키마 보기" Pretendard 14px #6B7280 + ▼ chevron toggle. Tappable.
   Expanded: JetBrains Mono 14px on #F3F4F6, 4px #4F46E5 left border, 16px padding:
   CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)
   ORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)

4. Choice Cards — A, B, C, D stacked vertically, 12px gap, 16px top margin.

   CHOICE A — with SUCCESSFUL execution result:
   - White card, 12px radius, 20px padding
   - Top: Radio (unselected, #D1D5DB circle) + "A" Pretendard bold
   - Code block: JetBrains Mono 14px, #F3F4F6 bg, 4px #4F46E5 left border:
     SELECT c.name, COUNT(\*) AS cnt
     FROM CUSTOMER c
     JOIN ORDERS o ON c.id = o.customer_id
     GROUP BY c.name
   - "실행" button: 32px height, outlined #4F46E5, right-aligned below code
   - Result (SUCCESS): #F0FDF4 background, 4px #22C55E left border, 12px top margin.
     "✓ 3행 · 34ms" in #16A34A 14px.
     Table: zebra rows (#FAFAFA alt), JetBrains Mono 13px values, Pretendard bold 13px headers:
     | name | cnt |
     | 홍길동 | 2 |
     | 김영희 | 3 |
     | 이철수 | 1 |

   CHOICE B — with ERROR execution result:
   - Radio (unselected) + "B" bold
   - SQL code block (different SQL with wrong column name)
   - "실행" button
   - Result (ERROR): #FEF2F2 background, 4px #EF4444 left border.
     "⚠ SQL_SYNTAX" JetBrains Mono bold #EF4444
     "Unknown column 'o.cust_id' in 'on clause'" Pretendard 14px #111827
     "AI에게 물어보기" text link #4F46E5, right-aligned

   CHOICE C — selected, no execution yet:
   - Radio (SELECTED: #4F46E5 filled, white inner dot) + "C" bold
   - SQL code block
   - "실행" button, no result panel

   CHOICE D — unselected, default state:
   - Radio (unselected) + "D" bold
   - SQL code block
   - "실행" button

5. Submit Button (sticky bottom, 16px padding, white background, top 1px #E5E7EB border):
   Full-width #4F46E5 button, white text "제출", Pretendard 16px bold, 48px height, 8px radius.
   Show active state (C selected) and reference disabled state (#E5E7EB bg, #9CA3AF text) if nothing selected.

Code readability is paramount. Generous padding. Clear success (#F0FDF4 green) vs error (#FEF2F2 red) distinction. Korean text throughout.
