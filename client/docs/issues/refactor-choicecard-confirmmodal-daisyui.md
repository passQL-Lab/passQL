## 제목

🚀 [기능개선][버튼 컴포넌트] ChoiceCard · ConfirmModal daisyUI 버튼 클래스 적용

## 본문

## 📝 현재 문제점

- `ChoiceCard`에서 `btn-compact` 커스텀 클래스를 사용하고 있음
- `ConfirmModal`에서 `btn-primary`, `btn-secondary` 커스텀 클래스를 사용하고 있음
- Home.tsx에서 동일한 버튼 클래스를 daisyUI로 전환한 것과 일관성이 없는 상태

## 🛠️ 해결 방안 / 제안 기능

- `btn-compact` → `btn btn-xs btn-outline btn-primary` 로 교체
- `btn-primary` → `btn btn-primary` 로 교체
- `btn-secondary` → `btn btn-secondary` 로 교체
- 구조 변경 없이 클래스 교체만 진행

## ⚙️ 작업 내용

- `ChoiceCard.tsx`: btn-compact 교체 (2곳)
- `ConfirmModal.tsx`: btn-primary, btn-secondary 교체 (각 1곳)

## 🙋‍♂️ 담당자

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
