# ❗[버그][홈화면] 추천 문제 새로고침 버튼 spinning 고착 및 onAnimationEnd 위치 버그

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

홈화면 AI 추천문제 섹션에 추가된 새로고침 버튼에서 두 가지 버그가 발견됨.

1. `onAnimationEnd` 핸들러가 `<button>`에 붙어있으나 실제 애니메이션(`animate-refresh-once`)은 내부 `<RefreshCw>` SVG에 적용되어 있어, 이벤트가 버튼까지 버블링되지 않으면 `spinning` state가 `true`에서 영구 고착될 수 있음
2. `refetchRecommendations()` 호출 실패 시 `.then()`이 실행되지 않아 `spinning`이 `true`로 남고 버튼이 영구 비활성화됨

관련 파일: `client/src/pages/Home.tsx`

🔄재현 방법
---

**버그 1 (onAnimationEnd 위치)**
1. 홈화면 진입
2. AI 추천문제 섹션의 새로고침 버튼 클릭
3. 브라우저 개발자 도구에서 `animationend` 이벤트 발생 위치 확인
4. 이벤트가 `<button>`이 아닌 내부 SVG에서 발생함을 확인

**버그 2 (refetch 실패 시 고착)**
1. 네트워크를 오프라인으로 전환
2. 홈화면 AI 추천문제 새로고침 버튼 클릭
3. 버튼이 비활성화(opacity-40) 상태로 영구 고착되어 재시도 불가

📸참고 자료
---

- `client/src/pages/Home.tsx` 78-84줄 (handleRefresh), 308-319줄 (버튼 JSX)

✅예상 동작
---

- 새로고침 아이콘이 360도 1회전 후 정상적으로 `spinning` state가 `false`로 초기화되어야 함
- refetch 성공/실패 여부와 관계없이 버튼이 다시 활성화되어야 함

⚙️환경 정보
---

- **OS**: -
- **브라우저**: -
- **기기**: -

🙋‍♂️담당자
---

- **백엔드**: 이름
- **프론트엔드**: 이름
- **디자인**: 이름
