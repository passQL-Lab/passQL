# AI 추천 문제 세션 내 중복 제외 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 화면 AI 추천 문제 새로고침 버튼 클릭 시 이번 세션에서 이미 추천된 문제는 제외하고 새 문제를 반환한다.

**Architecture:** 백엔드는 `excludeQuestionUuid`(단수)를 `excludeQuestionUuids`(복수 List)로 확장하고, 프론트엔드는 `seenUuids` state를 유지해 응답 도착 시 누적하고 다음 요청 시 전달한다. 브라우저 새로고침 시 React state가 초기화되어 자연스럽게 리셋된다.

**Tech Stack:** Spring Boot (Java), React 19 + TypeScript, React Query (TanStack Query)

---

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `server/PQL-Web/src/main/java/com/passql/web/controller/QuestionController.java` | 수정 | `excludeQuestionUuid` → `excludeQuestionUuids` (List) |
| `server/PQL-Application/src/main/java/com/passql/application/service/RecommendationService.java` | 수정 | `recommend()` 시그니처 변경, mustNotIds에 리스트 추가 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionService.java` | 수정 | `getRecommendations()` 시그니처 변경, 복수 제외 처리 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionRepository.java` | 수정 | `findRandomActiveExcludingList()` 쿼리 추가 |
| `client/src/api/questions.ts` | 수정 | `excludeQuestionUuids` 배열 반복 append 직렬화 |
| `client/src/hooks/useHome.ts` | 수정 | `useRecommendations(excludeUuids)` 파라미터 추가 |
| `client/src/pages/Home.tsx` | 수정 | `seenUuids` state 추가, 응답 누적, 새로고침 시 전달 |

---

### Task 1: QuestionRepository — 복수 제외 쿼리 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionRepository.java`

현재 `findRandomActiveExcluding`은 단일 UUID만 제외한다. 복수 제외를 위한 새 쿼리를 추가한다.

- [ ] **Step 1: QuestionRepository에 새 쿼리 메서드 추가**

기존 `findRandomActiveExcluding` 아래에 다음을 추가한다:

```java
// 복수 UUID 제외 — 세션 내 이미 추천된 문제를 제외할 때 사용
@Query(value = "SELECT * FROM question WHERE is_active = true AND question_uuid::text NOT IN (:excludeUuids) ORDER BY RANDOM() LIMIT :size", nativeQuery = true)
List<Question> findRandomActiveExcludingList(@Param("size") int size, @Param("excludeUuids") List<String> excludeUuids);
```

- [ ] **Step 2: 서버 빌드 확인**

```bash
cd server && ./gradlew :PQL-Domain-Question:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionRepository.java
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : feat : QuestionRepository 복수 UUID 제외 쿼리 추가 https://github.com/passQL-Lab/passQL/issues/284"
```

---

### Task 2: QuestionService — getRecommendations 복수 제외 처리

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionService.java:158-171`

- [ ] **Step 1: getRecommendations 시그니처 및 구현 변경**

기존:
```java
public RecommendationsResponse getRecommendations(int size, UUID excludeQuestionUuid) {
    int clamped = Math.max(1, Math.min(size, 5));
    UUID exclude = excludeQuestionUuid;
    if (exclude == null) {
        DailyChallenge dc = dailyChallengeRepository.findByChallengeDate(LocalDate.now()).orElse(null);
        if (dc != null) {
            exclude = dc.getQuestionUuid();
        }
    }
    List<Question> list = (exclude != null)
            ? questionRepository.findRandomActiveExcluding(clamped, exclude.toString())
            : questionRepository.findRandomActive(clamped);
    return new RecommendationsResponse(list.stream().map(this::toSummary).toList());
}
```

변경 후:
```java
public RecommendationsResponse getRecommendations(int size, List<UUID> excludeQuestionUuids) {
    int clamped = Math.max(1, Math.min(size, 5));

    // 오늘의 문제도 제외 목록에 추가
    List<String> excludeList = new ArrayList<>(
            excludeQuestionUuids != null
                    ? excludeQuestionUuids.stream().map(UUID::toString).toList()
                    : List.of()
    );
    DailyChallenge dc = dailyChallengeRepository.findByChallengeDate(LocalDate.now()).orElse(null);
    if (dc != null) {
        excludeList.add(dc.getQuestionUuid().toString());
    }

    List<Question> list = excludeList.isEmpty()
            ? questionRepository.findRandomActive(clamped)
            : questionRepository.findRandomActiveExcludingList(clamped, excludeList);
    return new RecommendationsResponse(list.stream().map(this::toSummary).toList());
}
```

import도 확인 — `java.util.ArrayList`, `java.util.List` 이미 있을 것이나 없으면 추가한다.

- [ ] **Step 2: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Domain-Question:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionService.java
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : feat : QuestionService getRecommendations 복수 UUID 제외 처리 https://github.com/passQL-Lab/passQL/issues/284"
```

---

### Task 3: RecommendationService — recommend() 시그니처 변경

**Files:**
- Modify: `server/PQL-Application/src/main/java/com/passql/application/service/RecommendationService.java`

- [ ] **Step 1: recommend() 시그니처 및 mustNotIds 처리 변경**

기존:
```java
public RecommendationsResponse recommend(int size, UUID excludeQuestionUuid, UUID memberUuid) {
    int clamped = Math.max(1, Math.min(size, 5));
    if (memberUuid != null) {
        RecommendationsResponse aiResult = tryAiRecommend(memberUuid, clamped, excludeQuestionUuid);
        if (aiResult != null && !aiResult.questions().isEmpty()) {
            return aiResult;
        }
        log.info("[recommendation] AI 추천 결과 없음, RANDOM fallback: memberUuid={}", memberUuid);
    }
    return questionService.getRecommendations(clamped, excludeQuestionUuid);
}
```

변경 후:
```java
public RecommendationsResponse recommend(int size, List<UUID> excludeQuestionUuids, UUID memberUuid) {
    int clamped = Math.max(1, Math.min(size, 5));
    if (memberUuid != null) {
        RecommendationsResponse aiResult = tryAiRecommend(memberUuid, clamped, excludeQuestionUuids);
        if (aiResult != null && !aiResult.questions().isEmpty()) {
            return aiResult;
        }
        log.info("[recommendation] AI 추천 결과 없음, RANDOM fallback: memberUuid={}", memberUuid);
    }
    return questionService.getRecommendations(clamped, excludeQuestionUuids);
}
```

- [ ] **Step 2: tryAiRecommend() 시그니처 및 mustNotIds 처리 변경**

기존:
```java
private RecommendationsResponse tryAiRecommend(UUID memberUuid, int size, UUID excludeQuestionUuid) {
    ...
    List<String> mustNotIds = new ArrayList<>(solved);
    if (excludeQuestionUuid != null) {
        mustNotIds.add(excludeQuestionUuid.toString());
    }
    ...
}
```

변경 후:
```java
private RecommendationsResponse tryAiRecommend(UUID memberUuid, int size, List<UUID> excludeQuestionUuids) {
    ...
    List<String> mustNotIds = new ArrayList<>(solved);
    if (excludeQuestionUuids != null) {
        excludeQuestionUuids.forEach(uuid -> mustNotIds.add(uuid.toString()));
    }
    ...
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Application:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Application/src/main/java/com/passql/application/service/RecommendationService.java
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : feat : RecommendationService 복수 UUID 제외 처리 https://github.com/passQL-Lab/passQL/issues/284"
```

---

### Task 4: QuestionController — excludeQuestionUuids 복수 파라미터

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/QuestionController.java`

- [ ] **Step 1: @RequestParam 단수 → 복수 변경**

기존:
```java
@GetMapping("/recommendations")
public ResponseEntity<RecommendationsResponse> getRecommendations(
    @AuthMember LoginMember loginMember,
    @RequestParam(defaultValue = "3") int size,
    @RequestParam(required = false) UUID excludeQuestionUuid
) {
    return ResponseEntity.ok(recommendationService.recommend(size, excludeQuestionUuid, loginMember.memberUuid()));
}
```

변경 후:
```java
@GetMapping("/recommendations")
public ResponseEntity<RecommendationsResponse> getRecommendations(
    @AuthMember LoginMember loginMember,
    @RequestParam(defaultValue = "3") int size,
    @RequestParam(required = false) List<String> excludeQuestionUuids
) {
    // String → UUID 변환 — Controller는 변환만 담당
    List<UUID> excludeUuids = excludeQuestionUuids == null ? List.of() :
            excludeQuestionUuids.stream()
                    .map(UUID::fromString)
                    .toList();
    return ResponseEntity.ok(recommendationService.recommend(size, excludeUuids, loginMember.memberUuid()));
}
```

`java.util.List`, `java.util.UUID` import 확인 후 없으면 추가한다.

- [ ] **Step 2: 전체 서버 빌드 확인**

```bash
cd server && ./gradlew :PQL-Web:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/QuestionController.java
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : feat : QuestionController excludeQuestionUuids 복수 파라미터 적용 https://github.com/passQL-Lab/passQL/issues/284"
```

---

### Task 5: 프론트 API — fetchRecommendations 복수 파라미터

**Files:**
- Modify: `client/src/api/questions.ts`

- [ ] **Step 1: fetchRecommendations 함수 시그니처 및 직렬화 변경**

기존:
```typescript
export function fetchRecommendations(
  size?: number,
  excludeQuestionUuid?: string,
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (size != null) query.set("size", String(size));
  if (excludeQuestionUuid) query.set("excludeQuestionUuid", excludeQuestionUuid);
  const qs = query.toString();
  return apiFetch(`/questions/recommendations${qs ? `?${qs}` : ""}`);
}
```

변경 후:
```typescript
export function fetchRecommendations(
  size?: number,
  excludeQuestionUuids?: string[],
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (size != null) query.set("size", String(size));
  // 동일 키 반복 append — Spring @RequestParam List<String> 자동 처리
  excludeQuestionUuids?.forEach((uuid) => query.append("excludeQuestionUuids", uuid));
  const qs = query.toString();
  return apiFetch(`/questions/recommendations${qs ? `?${qs}` : ""}`);
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd client && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add client/src/api/questions.ts
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : feat : fetchRecommendations 복수 UUID 파라미터 직렬화 https://github.com/passQL-Lab/passQL/issues/284"
```

---

### Task 6: useHome 훅 — excludeUuids 파라미터 추가

**Files:**
- Modify: `client/src/hooks/useHome.ts`

- [ ] **Step 1: useRecommendations 파라미터 추가**

기존:
```typescript
export function useRecommendations() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["recommendations", accessToken],
    queryFn: () => fetchRecommendations(3),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
```

변경 후:
```typescript
export function useRecommendations(excludeUuids: string[] = []) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    // excludeUuids가 바뀌면 새 요청 트리거 — 세션 내 중복 제외 핵심
    queryKey: ["recommendations", accessToken, excludeUuids],
    queryFn: () => fetchRecommendations(3, excludeUuids),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd client && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add client/src/hooks/useHome.ts
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : feat : useRecommendations excludeUuids 파라미터 추가 https://github.com/passQL-Lab/passQL/issues/284"
```

---

### Task 7: Home.tsx — seenUuids state 추가 및 누적

**Files:**
- Modify: `client/src/pages/Home.tsx`

- [ ] **Step 1: seenUuids state 추가 및 useRecommendations에 전달**

`const [refreshKey, setRefreshKey] = useState(0);` 아래에 추가:

```typescript
// 세션 내 이미 추천된 UUID 누적 — 새로고침 시 제외 목록으로 전달
const [seenUuids, setSeenUuids] = useState<string[]>([]);
```

`useRecommendations()` 호출부를 변경:

```typescript
const {
  data: recommendations,
  isError: recommendationsError,
  refetch: refetchRecommendations,
  isFetching: recommendationsFetching,
} = useRecommendations(seenUuids);
```

- [ ] **Step 2: 최초 응답 도착 시 seenUuids 누적**

`useRecommendations` 훅 호출 바로 아래에 useEffect 추가:

```typescript
// 추천 결과가 도착하면 해당 UUID를 seenUuids에 누적
useEffect(() => {
  if (recommendations?.questions && recommendations.questions.length > 0) {
    setSeenUuids((prev) => {
      const newUuids = recommendations.questions
        .map((q) => q.questionUuid)
        .filter((uuid) => !prev.includes(uuid));
      return newUuids.length > 0 ? [...prev, ...newUuids] : prev;
    });
  }
}, [recommendations]);
```

`useEffect`가 import에 없으면 추가한다:
```typescript
import { useState, useCallback, useEffect, type CSSProperties } from "react";
```

- [ ] **Step 3: 타입 체크**

```bash
cd client && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add client/src/pages/Home.tsx
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : feat : Home seenUuids state 추가 및 추천 결과 누적 https://github.com/passQL-Lab/passQL/issues/284"
```

---

### Task 8: 동작 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
cd client && npm run dev
```

- [ ] **Step 2: 홈 화면에서 새로고침 3회 테스트**

브라우저에서 홈 화면 진입 후:
1. 추천 문제 3개 UUID 메모
2. 새로고침 버튼 클릭 → 새 3개가 이전과 다른지 확인
3. 한 번 더 클릭 → 총 9개 모두 다른지 확인

Network 탭에서 요청 URL 확인:
```
/api/questions/recommendations?size=3&excludeQuestionUuids=uuid1&excludeQuestionUuids=uuid2&excludeQuestionUuids=uuid3
```

- [ ] **Step 3: 브라우저 새로고침 후 초기화 확인**

F5(브라우저 새로고침) 후 최초 요청에 `excludeQuestionUuids` 파라미터가 없는지 확인.

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "AI 추천 문제 새로고침 세션 내 중복 제외 : chore : 동작 검증 완료 https://github.com/passQL-Lab/passQL/issues/284"
```
