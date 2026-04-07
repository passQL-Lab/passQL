Design the Stats screen of "SQLD Master" SQL study web app.

Responsive web app (future Electron). Show desktop (1280px, centered 720px) AND mobile (375px) side by side.

Design system: Pretendard, minimalist, #4F46E5 accent, geometric data visualization.

Desktop: Left sidebar (통계 active). Mobile: Bottom tab bar (통계 active).

Content:

1. Summary metrics — 3 metrics in a single white card (12px radius, 20px padding), horizontal row.
   Each metric: Large number Pretendard 28px bold #111827 + label below Pretendard 14px #6B7280.
   - "42" / "푼 문제"
   - "68%" / "정답률"
   - "3일" / "연속 학습"
     Separated by thin vertical dividers (#E5E7EB). Desktop: equal columns. Mobile: 3-column compact.

2. Topic Mastery Heatmap — 24px top margin.
   Section title: "토픽별 숙련도" Pretendard 22px bold #111827.
   Grid: 3 columns mobile, 4 columns desktop, 8px gap.
   Each cell: rounded-lg (8px), 48px minimum height, centered content.
   - Topic name: Pretendard 13px bold
   - Percentage: Pretendard 12px below the name
   - Background color by mastery level:
     0–30%: #F5F5F5 (gray), text #6B7280
     31–50%: #EEF2FF (light indigo), text #4F46E5
     51–70%: #C7D2FE (medium indigo), text #4F46E5
     71–85%: #818CF8 (indigo), text #FFFFFF
     86–100%: #4F46E5 (deep indigo), text #FFFFFF

   Show 10 topics with varied percentages: JOIN 85%, 서브쿼리 42%, GROUP BY 91%, DDL 35%, DML 68%, 제약조건 55%, 인덱스 28%, 윈도우함수 12%, WHERE 78%, ORDER BY 95%.

3. "최근 틀린 문제" — 24px top margin.
   Section title: "최근 틀린 문제" Pretendard 22px bold (left) + "더 보기" #4F46E5 14px link (right).
   List of 4 rows, separated by 1px #E5E7EB dividers:
   - Left: "Q015" JetBrains Mono 12px #9CA3AF
   - Middle: Stem preview Pretendard 15px #111827 (1 line) + topic pill "JOIN" (#EEF2FF/#4F46E5)
   - Right: "2일 전" Pretendard 12px #9CA3AF + chevron #9CA3AF
     Tappable rows.

4. Weekly Trend (optional, if space):
   Mini bar chart, 7 bars for last 7 days, #4F46E5 fill, 48px max height. No axis labels, just the shape. Day labels below (월 화 수 목 금 토 일) in 12px #9CA3AF.

Heatmap grid is the visual centerpiece — geometric, colorful but controlled. Korean text throughout.
