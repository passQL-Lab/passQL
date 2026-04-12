## 제목
🚀 [기능개선][프론트엔드] Home.tsx daisyUI 컴포넌트 클래스 적용 (파일럿)

## 본문

📝 현재 문제점
---

- daisyUI 5가 설치되어 있고 passql 커스텀 테마까지 정의되어 있으나, 실제 컴포넌트에서 daisyUI 클래스를 전혀 사용하지 않고 있음
- 카드, 버튼, 뱃지, 스켈레톤 등 daisyUI로 대체 가능한 요소들이 모두 수동 커스텀 클래스로 구현되어 있어 유지보수 부담이 있음

🛠️ 해결 방안 / 제안 기능
---

- Home.tsx를 파일럿으로 삼아 1:1 대체 가능한 클래스를 daisyUI 컴포넌트 클래스로 교체
- passQL 전용 클래스(typography, 시맨틱 카드, badge-topic 등)는 유지하고 구조 변경 최소화

⚙️ 작업 내용
---

- 카드 영역: `card-base` → `card card-body` 로 전환
- 버튼: 재시도 버튼 → `btn btn-xs btn-outline btn-primary` 로 전환
- 로딩 스켈레톤: 수동 pulse 클래스 → `skeleton` 으로 전환
- 연속 학습 뱃지: 수동 인라인 스타일 조합 → `badge badge-warning` 으로 전환

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
