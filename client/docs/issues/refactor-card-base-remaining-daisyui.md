## 제목
🚀 [기능개선][리팩토링] card-base 커스텀 CSS → Tailwind 유틸리티 교체 (나머지 파일)

## 본문

📝 현재 문제점
---

- `Questions.tsx` (#183) 교체 완료 후 나머지 파일에 `card-base` 가 15곳 잔존
- 페이지: `QuestionDetail.tsx` 2곳, `AnswerFeedback.tsx` 3곳, `Stats.tsx` 2곳, `Settings.tsx` 1곳, `Home.tsx` 1곳
- 컴포넌트: `SqlPlayground.tsx` 1곳, `StatsBarChart.tsx` 1곳, `StatsAnalysisCard.tsx` 2곳, `StatsTopicList.tsx` 1곳, `StatsRadarChart.tsx` 1곳
- 교체 완료 후 `src/styles/components.css`의 `.card-base` 스타일 블록 삭제 가능

🛠️ 해결 방안 / 제안 기능
---

- `card-base` → `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` Tailwind 유틸리티로 교체
- 모든 사용처 교체 완료 시 `components.css`에서 `.card-base` 블록 삭제

⚙️ 작업 내용
---

- `src/pages/QuestionDetail.tsx`: card-base 2곳 교체
- `src/pages/AnswerFeedback.tsx`: card-base 3곳 교체
- `src/pages/Stats.tsx`: card-base 2곳 교체
- `src/pages/Settings.tsx`: card-base 1곳 교체
- `src/pages/Home.tsx`: card-base 1곳 교체
- `src/components/SqlPlayground.tsx`: card-base 1곳 교체
- `src/components/StatsBarChart.tsx`: card-base 1곳 교체
- `src/components/StatsAnalysisCard.tsx`: card-base 2곳 교체
- `src/components/StatsTopicList.tsx`: card-base 1곳 교체
- `src/components/StatsRadarChart.tsx`: card-base 1곳 교체
- `src/styles/components.css`: `.card-base` 스타일 블록 삭제

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
