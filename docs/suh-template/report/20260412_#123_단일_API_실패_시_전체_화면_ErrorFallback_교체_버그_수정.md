# ❗[버그][홈] 단일 API 실패 시 전체 화면 ErrorFallback 교체 버그 #123

## 개요

홈화면에서 7개 API를 병렬 호출하던 중 `useProgress()`(`/progress`) 하나가 500 에러를 반환하면, 나머지 4개 API가 성공했음에도 홈 전체가 "데이터를 불러올 수 없습니다" ErrorFallback 화면으로 교체되는 문제를 수정했다. 각 섹션이 독립적으로 에러/로딩 상태를 처리하는 Graceful Degradation 구조로 전환하였다.

## 변경 사항

### 에러 처리 구조 개선
- `client/src/pages/Home.tsx`: 전체 화면 `if (isError) return <ErrorFallback />` 및 `if (isLoading) return <전체스켈레톤>` 분기 제거. 각 훅의 `isLoading` / `isError` / `refetch`를 개별 구조분해하여 섹션별로 독립 처리하도록 전면 개편
- `client/src/hooks/useProgress.ts`: `retry: false` 추가 — 기본값 3회 재시도로 약 30초간 스켈레톤이 전체 화면을 덮던 문제 해결

### 섹션별 에러 처리 정책

| 섹션 | 에러 처리 방식 |
|------|--------------|
| 학습 현황 (`useProgress`) | 해당 섹션에 "학습 데이터를 불러올 수 없습니다" + 재시도 버튼 인라인 표시 |
| 히트맵 (`useHeatmap`) | 히트맵 영역에 "히트맵을 불러올 수 없습니다" + 재시도 버튼 인라인 표시 |
| 추천 문제 (`useRecommendations`) | `isError` 명시적 감지 후 섹션 전체 숨김 처리 |
| 인사말, 오늘의 문제, 시험 일정 | 에러 시 data가 없으므로 각자 fallback 값으로 자연스럽게 렌더링 유지 |

## 주요 구현 내용

**기존 구조의 문제점**

`useProgress` 하나의 `isError` 상태가 홈 전체를 덮는 구조였다.

```tsx
// 기존 — useProgress 하나의 에러가 전체 화면을 교체
const { data: progress, isLoading, isError, refetch } = useProgress();
if (isError) return <ErrorFallback onRetry={() => refetch()} />;
```

또한 `useProgress.ts`에 `retry` 설정이 없어 기본값 3회 재시도가 적용되면서, 에러 확정까지 약 30초간 전체 스켈레톤이 화면을 덮는 이중 문제가 있었다.

**개선된 구조**

각 훅의 상태를 개별 구조분해하여 섹션별로 독립 처리한다.

```tsx
// 개선 — 섹션별 독립 에러/로딩 처리
const { data: progress, isLoading: progressLoading, isError: progressError, refetch: refetchProgress } = useProgress();
const { data: heatmap, isLoading: heatmapLoading, isError: heatmapError, refetch: refetchHeatmap } = useHeatmap();
const { data: recommendations, isError: recommendationsError } = useRecommendations();
```

각 섹션은 자신의 상태에 따라 스켈레톤 → 에러 UI → 정상 렌더링 순서로 독립 분기한다. progress 에러 시에도 `solvedCount`, `correctRate`, `streakDays`는 `?? 0` fallback으로 안전하게 처리된다.

## 주의사항

- `useHome.ts`의 나머지 훅들(`useGreeting`, `useTodayQuestion`, `useSelectedSchedule`, `useHeatmap`)은 이미 `retry: false` 설정이 있었으나, `useProgress`만 누락되어 있었다. 신규 훅 추가 시 `retry: false` 설정을 통일할 것.
- 홈화면 전체 수준의 `ErrorFallback`은 이번 수정으로 완전히 제거되었다. 추후 인증 실패 등 홈 자체를 렌더링할 수 없는 상황에 대한 처리가 필요하다면 별도 검토가 필요하다.
