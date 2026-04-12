## 제목
🚀 [기능개선][문제 풀이] QuestionDetail · Stats · Settings daisyUI 클래스 적용

## 본문

📝 현재 문제점
---

- `QuestionDetail.tsx`: card-base 2곳, btn-primary 1곳, badge-topic 1곳, code-block 1곳
- `Stats.tsx`: card-base 2곳
- `Settings.tsx`: card-base 1곳
- Home.tsx, Questions.tsx 전환 이후 마지막으로 남은 페이지들

🛠️ 해결 방안 / 제안 기능
---

- `card-base` → `card bg-white p-4 sm:p-6` 로 교체
- `btn-primary` → `btn btn-primary` 로 교체
- `code-block` → daisyUI `mockup-code` 또는 커스텀 유지 여부 검토
- `badge-topic` 유지 (passQL 전용)

⚙️ 작업 내용
---

- `QuestionDetail.tsx`: card-base, btn-primary, code-block 교체
- `Stats.tsx`: card-base 교체 (2곳)
- `Settings.tsx`: card-base 교체 (1곳)

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
