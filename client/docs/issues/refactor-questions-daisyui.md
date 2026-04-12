## 제목
🚀 [기능개선][문제 목록] Questions.tsx daisyUI 컴포넌트 클래스 적용

## 본문

📝 현재 문제점
---

- `Questions.tsx`에 커스텀 CSS 클래스가 가장 많이 남아있음 (card-base 4곳, filter-dropdown 2곳, badge-topic 1곳)
- 특히 `filter-dropdown`은 현재 커스텀으로만 구현되어 있어 daisyUI 대체 검토 필요

🛠️ 해결 방안 / 제안 기능
---

- `card-base` → `card bg-white p-4 sm:p-6` 로 교체
- `filter-dropdown` → daisyUI `select` 또는 `btn` + dropdown 조합으로 교체 검토
- `badge-topic` 유지 (passQL 전용 인디고 배지)

⚙️ 작업 내용
---

- `Questions.tsx`: card-base 교체 (4곳)
- `Questions.tsx`: filter-dropdown 교체 또는 daisyUI 대체 방안 적용 (2곳)

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
