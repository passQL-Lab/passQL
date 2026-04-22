# ❗[버그][홈화면] 단일 API 실패 시 전체 화면 ErrorFallback 교체 버그

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- 홈화면 진입 시 7개 API를 병렬 호출하는데, `useProgress()`(`/progress`) 하나가 500 에러를 반환하면 홈 전체가 "데이터를 불러올 수 없습니다" ErrorFallback 화면으로 교체된다.
- 실제로는 `/home/greeting`, `/members/me`, `/questions/today`, `/exam-schedules/selected` 4개 API가 성공했음에도 불구하고 사용자는 빈 에러 화면만 보게 된다.
- `useProgress`에 `retry` 설정이 없어 기본값(3회)이 적용되므로, 에러 확정까지 약 30초 동안 로딩 스켈레톤이 전체 화면을 덮는 문제도 동반된다.

🔄재현 방법
---

1. 백엔드 `/progress`, `/progress/heatmap`, `/questions/recommendations` API를 500 에러 상태로 둔다.
2. 홈화면(`/`) 진입
3. 나머지 API(`/home/greeting`, `/members/me`, `/questions/today`, `/exam-schedules/selected`)는 정상 응답함에도 전체 화면이 ErrorFallback으로 교체되는 것을 확인

📸참고 자료
---

- 콘솔 에러: `GET /api/progress 500 (Internal Server Error)`
- 화면: "데이터를 불러올 수 없습니다 / 다시 시도" 화면 전체 교체
- 관련 파일:
  - `client/src/pages/Home.tsx` — L37~39 `if (isError) return <ErrorFallback />`
  - `client/src/hooks/useProgress.ts` — retry 미설정(기본값 3)

✅예상 동작
---

- `/progress` API 실패 시 → 학습 현황 섹션만 인라인 에러 표시 + 재시도 버튼
- `/progress/heatmap` API 실패 시 → 히트맵 영역만 인라인 에러 표시 + 재시도 버튼
- `/questions/recommendations` API 실패 시 → 추천 문제 섹션만 숨김 처리
- 성공한 API(인사말, 오늘의 문제, 시험 일정 등)의 데이터는 정상 렌더링 유지

⚙️환경 정보
---

- **OS**: -
- **브라우저**: Chrome
- **기기**: Web

🙋‍♂️담당자
---

- **프론트엔드**: 
