Design the AI Explanation Sheet for "SQLD Master" SQL study web app.

This sheet opens when the user taps "AI에게 자세히 물어보기" or "AI에게 물어보기" from the feedback page or question detail screen.

Responsive web app (future Electron). Show desktop (1280px) AND mobile (375px).

- Desktop: Centered modal, 520px width, 80vh max-height, 24px radius, #111827/50% overlay.
- Mobile: Bottom sheet sliding up, 90% screen height, rounded-t-2xl, drag handle.

Design system: Pretendard, JetBrains Mono, #4F46E5 accent.

1. Header (sticky top, bottom 1px #E5E7EB border, 16px padding):
   - Left: "AI 해설" Pretendard 18px bold #111827
   - Right: ✕ close button, 32px, #6B7280, hover #111827

2. Loading state:
   - 3 skeleton lines (pulsing #E5E7EB bars, staggered widths: 100%, 85%, 60%)
   - Below: "AI가 분석 중입니다..." Pretendard 14px #9CA3AF, centered
   - Subtle pulsing animation

3. Loaded state — Markdown-rendered content, scrollable, 20px padding:

   Pretendard 15px #374151, line-height 1.7:

   "선택지 C가 오답인 이유를 분석해 보겠습니다.

   **문제점: GROUP BY 절의 컬럼 참조 오류**

   선택지 C의 SQL에서는 `GROUP BY c.name` 대신 `GROUP BY name`을 사용했습니다."
   - Bold text: Pretendard bold #111827
   - Inline code: JetBrains Mono 13px, #F3F4F6 background pill, 4px horizontal padding, 2px radius
   - Code comparison block: Full-width JetBrains Mono 13px, #F3F4F6 background, 4px #4F46E5 left border, showing correct vs incorrect SQL
   - Paragraph spacing: 16px between paragraphs

4. Footer (bottom of content area, 16px top margin):
   "프롬프트 v1 · qwen2.5:7b" Pretendard 12px #9CA3AF, right-aligned.

The AI explanation should feel like reading a well-formatted article. Clean, breathable, easy to follow. Korean text throughout.
