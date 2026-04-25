# AI 추천 문제 세션 내 중복 제외 설계

## 배경

홈 화면의 AI 추천 문제 새로고침 버튼을 누르면 매번 같은 문제가 나온다. Qdrant 벡터 검색이 결정론적(deterministic)이라 동일한 쿼리 벡터에서는 항상 같은 Top-K 결과가 반환되기 때문이다.

## 목표

새로고침 버튼을 누를 때마다 이번 세션에서 이미 추천된 문제는 다시 나오지 않는다. 브라우저 새로고침 시 자연스럽게 초기화된다.

## 범위 결정

- 세션 내 중복 제외만 구현 (클라이언트 state 관리)
- "이미 푼 문제 전체 영구 제외"는 범위 밖 — 문제 고갈 위험 + 복습 학습 가치 훼손
- RANDOM fallback 동작 변경 없음

## 데이터 흐름

```
진입:    seenUuids=[]       → API(exclude 없음) → [A,B,C] → seenUuids=[A,B,C]
1회 클릭: seenUuids=[A,B,C] → API(exclude A,B,C) → [D,E,F] → seenUuids=[A~F]
2회 클릭: seenUuids=[A~F]   → API(exclude A~F)   → [G,H,I] → seenUuids=[A~I]
브라우저 새로고침: seenUuids=[] (초기화)
```

## 변경 목록

### 백엔드

**`QuestionController`**
- `@RequestParam(required = false) String excludeQuestionUuid` →
  `@RequestParam(required = false) List<String> excludeQuestionUuids`

**`RecommendationService`**
- `recommend()` 시그니처: `UUID excludeQuestionUuid` → `List<UUID> excludeQuestionUuids`
- `mustNotIds`에 리스트 전체 추가

### 프론트엔드

**`src/api/questions.ts`**
- `fetchRecommendations(size?, excludeQuestionUuid?)` →
  `fetchRecommendations(size?, excludeQuestionUuids?)`
- `URLSearchParams`에 UUID 배열을 반복 `append`로 직렬화

**`src/hooks/useHome.ts`**
- `useRecommendations(excludeUuids: string[] = [])` 파라미터 추가
- `queryKey: ["recommendations", accessToken, excludeUuids]` — 변경 시 재요청 트리거

**`src/pages/Home.tsx`**
- `seenUuids` state 추가 (`useState<string[]>([])`)
- 최초 응답 및 새로고침 응답 도착 시 반환된 UUID를 `seenUuids`에 누적
- `useRecommendations(seenUuids)` 형태로 전달
- `handleRefresh` 로직 유지 (spinning, refreshKey 애니메이션 그대로)

## API 파라미터 형식

```
GET /api/questions/recommendations?size=3
  &excludeQuestionUuids=uuid-1
  &excludeQuestionUuids=uuid-2
  &excludeQuestionUuids=uuid-3
```

Spring `@RequestParam List<String>` 이 동일 키 반복을 자동 처리한다.

## 에러 처리

- 추천 문제가 더 이상 없을 때(빈 배열 반환): 기존 목록 유지 + 버튼 비활성화 없음 (서버가 가능한 만큼 반환)
- API 실패 시: 기존 `recommendationsError` 처리 그대로

## 테스트 기준

- 새로고침 3회 후 총 9개 UUID가 모두 다른지 확인
- 브라우저 새로고침 후 `seenUuids`가 초기화되어 기존 문제가 다시 나오는지 확인
