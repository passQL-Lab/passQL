## 제목

🚀 [기능개선][문제 목록] Questions.tsx daisyUI 컴포넌트 클래스 적용

## 본문

## 📝 현재 문제점

- `Questions.tsx`에 커스텀 CSS 클래스가 가장 많이 남아있음
  - `card-base`: 4곳 (스켈레톤 2곳, 토픽 카드, 문제 카드)
  - `filter-dropdown`: 2곳 — 현재 코드베이스에서 Questions.tsx 단독 사용
  - `badge-topic`: 1곳 (passQL 전용 인디고 배지)

## 🛠️ 해결 방안 / 제안 기능

- `card-base` → `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` Tailwind 유틸리티로 교체
  - ※ 다른 파일(QuestionDetail, Stats 등 12곳)은 별도 이슈에서 순차 처리
- `filter-dropdown` → 순수 Tailwind 유틸리티로 교체 후 `components.css`에서 삭제 가능
- `badge-topic` 유지 (passQL 전용 인디고 배지, 대체 불필요)

## ⚙️ 작업 내용

- `Questions.tsx`: `card-base` 4곳 → Tailwind 유틸리티로 교체
- `Questions.tsx`: `filter-dropdown` / `filter-dropdown--active` 2곳 → Tailwind 유틸리티로 교체
- `src/styles/components.css`: `.filter-dropdown` 관련 스타일 3블록 삭제

## 🙋‍♂️ 담당자

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
