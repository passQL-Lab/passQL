---
name: ❗[버그][로그인] Tailwind 4 @theme --spacing-* 네임스페이스 충돌로 로그인 페이지 레이아웃 파괴
description: tokens.css의 커스텀 spacing 변수가 Tailwind 4 스케일과 충돌해 max-w-sm이 0.5rem으로 렌더링된 버그
type: bug
---

🗒️ 설명
---

`client/src/styles/tokens.css`의 `@theme {}` 블록 안에 `--spacing-sm`, `--spacing-lg` 등 커스텀 CSS 변수를 선언했는데, Tailwind CSS 4는 `@theme` 내부의 `--spacing-*` 네임스페이스를 **자체 spacing 스케일**로 취급한다. 그 결과 `max-w-sm`이 Tailwind 기본값 `24rem` 대신 `var(--spacing-sm)` = `0.5rem`으로 오버라이드되어 로그인 카드가 극도로 좁아지고 텍스트가 한 글자씩 세로로 출력되는 현상이 발생했다.

- **영향 범위**: `max-w-sm`, `max-w-md`, `max-w-lg` 등 모든 `max-w-*` Tailwind 유틸리티 클래스
- **발생 화면**: `/login` (로그인 페이지 전체)
- **근본 원인**: Tailwind 4의 `@theme` 블록은 `--spacing-*` 변수를 spacing 스케일로 예약함. 커스텀 변수 이름이 이 네임스페이스와 겹치면 Tailwind 내장 유틸리티 값이 커스텀 값으로 덮어씌워짐

🔄 재현 방법
---

1. `client/src/styles/tokens.css` 파일의 `@theme {}` 블록 안에 `--spacing-sm: 0.5rem` 형태의 변수가 있을 때
2. `className="w-full max-w-sm"` 클래스를 가진 요소가 있는 페이지 접속
3. 브라우저 DevTools → Elements → Computed → `max-width` 확인
4. `max-width: var(--spacing-sm)` (= `0.5rem`)으로 렌더링되는 것 확인
5. 카드 너비가 사실상 0에 가까워 텍스트가 세로로 한 글자씩 출력됨

📸 참고 자료
---

**DevTools 확인 내용 (버그 발생 시)**
```
.max-w-sm {
  max-width: var(--spacing-sm); /* 0.5rem — 의도치 않은 오버라이드 */
}
```

**버그 발생 코드 (수정 전 `tokens.css`)**
```css
@theme {
  --spacing-sm: 0.5rem;  /* Tailwind 4가 spacing scale로 예약한 네임스페이스 */
  --spacing-lg: 1rem;
  /* ... */
}
```

**수정 후 `tokens.css`**
```css
/* @theme 밖, :root에 --space-* 로 이름 변경 */
:root {
  --space-sm: 0.5rem;
  --space-lg: 1rem;
  /* ... */
}
```

✅ 예상 동작
---

- `max-w-sm`은 Tailwind 기본값인 `24rem`으로 렌더링되어야 함
- 로그인 카드가 `max-w-sm` 너비(약 384px)로 정상 표시
- 텍스트가 가로 방향으로 한 줄씩 정상 출력

⚙️ 환경 정보
---

- **OS**: macOS 15
- **브라우저**: Chrome (로컬호스트 및 Vercel 배포 환경 모두 동일 증상)
- **기기**: Desktop
- **관련 라이브러리**: Tailwind CSS v4, `client/src/styles/tokens.css`

**수정 파일**
- `client/src/styles/tokens.css` — `@theme` 내 `--spacing-*` 변수를 `:root` 의 `--space-*`로 이동

🙋‍♂️ 담당자
---

- **프론트엔드**: Cassiiopeia
