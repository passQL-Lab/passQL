# 홈 화면 FE API 호출 가이드라인

- 작성일: 2026-04-10
- 대상: 프론트엔드 개발자 (@EM-H20)
- 관련: 홈 화면 (`/`) 미연동 API 연동 작업

---

📄[문서][홈] 홈화면 API 연동 작업 명세

## 1. 현재 상태

### 지금 동작하는 것

| 섹션 | API | Hook | 파일 |
|------|-----|------|------|
| 사용자 이름 | `GET /members/me` | `useMember()` | `Home.tsx:39-47` |
| 스트릭 뱃지 | `GET /progress` | `useProgress()` | `Home.tsx:61-73` |
| 푼 문제 / 정답률 | `GET /progress` | `useProgress()` | `Home.tsx:75-87` |

### 아직 안 된 것 (이번 작업 범위)

| # | 섹션 | API | 함수 위치 | 타입 |
|---|------|-----|----------|------|
| 1 | 동적 인사말 | `GET /home/greeting` | `api/home.ts` | `GreetingResponse` |
| 2 | 오늘의 문제 카드 | `GET /questions/today` | `api/questions.ts` | `TodayQuestionResponse` |
| 3 | 시험 D-day 카드 | `GET /exam-schedules/selected` | `api/examSchedules.ts` | `ExamScheduleResponse` |
| 4 | 추천 문제 리스트 | `GET /questions/recommendations` | `api/questions.ts` | `RecommendationsResponse` |
| 5 | 학습 히트맵 캘린더 | `GET /progress/heatmap` | `api/progress.ts` (추가) | `HeatmapResponse` (추가) |
| 6 | 합격 준비도 | `GET /progress` (readiness 블록) | `api/progress.ts` | `ReadinessResponse` (타입 추가 필요) |

> **6번 합격 준비도**: BE 구현 완료. `ProgressResponse.readiness` 필드로 이미 내려오고 있음. FE 타입 추가 + 렌더링만 하면 됨.

---

## 2. API 호출 Flow

### 2.1 홈 진입 시 병렬 호출

```
사용자가 홈(/) 진입
    |
    +---> GET /members/me?memberUuid={uuid}        --> 닉네임
    |                                                   (기존, useMember)
    |
    +---> GET /home/greeting?memberUuid={uuid}     --> 인사말 메시지
    |                                                   (신규, useGreeting)
    |
    +---> GET /progress?memberUuid={uuid}          --> 통계 + readiness
    |                                                   (기존, useProgress)
    |
    +---> GET /questions/today?memberUuid={uuid}   --> 오늘의 문제
    |                                                   (신규, useTodayQuestion)
    |
    +---> GET /exam-schedules/selected             --> 시험 D-day
    |                                                   (신규, useSelectedSchedule)
    |
    +---> GET /questions/recommendations?size=3    --> 추천 문제 3개
    |                                                   (신규, useRecommendations)
    |
    +---> GET /progress/heatmap?memberUuid={uuid}  --> 히트맵 캘린더
                                                        (신규, useHeatmap)
```

**7개 API 동시 호출, 각각 독립적으로 로딩/에러 처리.**

### 2.2 섹션별 독립 렌더링 원칙

각 섹션은 자기 API가 실패해도 다른 섹션에 영향을 주지 않아야 한다.

```
[인사말]  -- greeting 실패 --> 정적 "안녕하세요, {닉네임}" fallback
[D-day]   -- selected 실패 --> 섹션 숨김
[오늘문제] -- today 실패   --> 섹션 숨김
[통계]    -- progress 실패 --> ErrorFallback (기존 동작 유지)
[추천]    -- reco 실패     --> 섹션 숨김
[히트맵]  -- heatmap 실패  --> 섹션 숨김
[준비도]  -- progress 응답에 항상 포함됨 (progress 성공이면 readiness도 있음)
```

---

## 3. 각 API 상세 스펙 및 요청 방법

### 3.1 인사말 (Greeting)

**요청**
```
GET /api/home/greeting?memberUuid={uuid}
```

**응답**
```json
{
  "nickname": "용감한 판다",
  "message": "용감한 판다님, SQLD 시험까지 D-14! 오늘도 화이팅하세요",
  "messageType": "COUNTDOWN"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `nickname` | string | 회원 닉네임 |
| `message` | string | 시간대/D-day/자격증 기반 동적 인사말 |
| `messageType` | string (enum) | `GENERAL` / `COUNTDOWN` (D-8~30) / `URGENT` (D-1~7) / `EXAM_DAY` (D-0) |

> **FE 타입 수정 필요**: 현재 `GreetingResponse`에 `message`만 있음. `nickname`, `messageType` 추가 필요.

```typescript
// types/api.ts 수정
export type GreetingMessageType = "GENERAL" | "COUNTDOWN" | "URGENT" | "EXAM_DAY";

export interface GreetingResponse {
  readonly nickname: string;
  readonly message: string;
  readonly messageType: GreetingMessageType;
}
```

**사용법**
```typescript
// api/home.ts -- 이미 존재
import { fetchGreeting } from "../api/home";

// hooks/useGreeting.ts -- 신규 생성
export function useGreeting() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    queryKey: ["greeting", uuid],
    queryFn: () => fetchGreeting(uuid),
    staleTime: 5 * 60 * 1000,  // 5분 캐시
  });
}
```

**렌더링**
- 성공: `greeting.message`를 인사말 영역에 표시 (BE가 닉네임+D-day 포함한 문장을 내려줌)
- `messageType`에 따라 스타일 분기 가능 (예: `URGENT`/`EXAM_DAY`면 강조 색상)
- 실패/로딩: 기존 정적 텍스트 "안녕하세요, {displayName}" 유지

---

### 3.2 오늘의 문제 (Today Question)

**요청**
```
GET /api/questions/today?memberUuid={uuid}
```

**응답**
```json
{
  "question": {
    "questionUuid": "abc-123",
    "topicName": "JOIN",
    "difficulty": 2,
    "stemPreview": "고객별 주문 수를 구하는 올바른 SQL은?"
  },
  "alreadySolvedToday": false
}
```

- `question`이 `null`이면: 활성 문제 0개 (섹션 숨김)
- `alreadySolvedToday`가 `true`이면: "오늘의 문제 완료" 상태 표시

**사용법**
```typescript
// hooks/useTodayQuestion.ts -- 신규 생성
export function useTodayQuestion() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    queryKey: ["todayQuestion", uuid],
    queryFn: () => fetchTodayQuestion(uuid),
    staleTime: 24 * 60 * 60 * 1000,  // 24시간 (하루 1문제)
  });
}
```

**렌더링**
- 카드 구성: 토픽 뱃지 + 난이도 별 + 지문 1줄(stemPreview)
- `alreadySolvedToday === false`: [도전하기] 버튼 -> `/questions/{questionUuid}`
- `alreadySolvedToday === true`: 체크 아이콘 + "오늘의 문제 완료" 텍스트, 버튼 비활성
- `question === null`: 섹션 전체 숨김

---

### 3.3 시험 D-day (Exam Schedule)

**요청**
```
GET /api/exam-schedules/selected
```

**응답** (선택된 시험이 있을 때)
```json
{
  "examScheduleUuid": "exam-456",
  "certType": "SQLD",
  "round": 1,
  "examDate": "2026-05-10",
  "isSelected": true
}
```

- 선택된 시험 없으면: `200 + null body`

**사용법**
```typescript
// hooks/useSelectedSchedule.ts -- 신규 생성
export function useSelectedSchedule() {
  return useQuery({
    queryKey: ["selectedSchedule"],
    queryFn: fetchSelectedSchedule,
    staleTime: 60 * 60 * 1000,  // 1시간 캐시
  });
}
```

**렌더링**
- 성공: "SQLD 1회" + "2026-05-10" 카드 표시
- **D-day 계산은 프론트에서 하지 않는다.** 인사말(`greeting.message`)에 이미 "D-14" 포함됨
- `null`이면: 섹션 숨김 (시험 미선택 상태)

---

### 3.4 추천 문제 (Recommendations)

**요청**
```
GET /api/questions/recommendations?size=3
```

- `size`: 가져올 개수 (기본 3, 최대 5)
- `excludeQuestionUuid`: 미지정 시 오늘의 문제 자동 제외 (백엔드 처리)

**응답**
```json
{
  "questions": [
    { "questionUuid": "q1", "topicName": "JOIN",       "difficulty": 2, "stemPreview": "고객별 주문 수를 구하는..." },
    { "questionUuid": "q2", "topicName": "JOIN",       "difficulty": 3, "stemPreview": "LEFT JOIN과 INNER JOIN의..." },
    { "questionUuid": "q3", "topicName": "서브쿼리",   "difficulty": 3, "stemPreview": "서브쿼리를 사용하여 평균 이상..." }
  ]
}
```

**사용법**
```typescript
// hooks/useRecommendations.ts -- 신규 생성
export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => fetchRecommendations(3),
    staleTime: 5 * 60 * 1000,  // 5분
  });
}
```

**렌더링**
- 문제 카드 리스트 (스크린샷 하단 참고)
- 각 카드: 토픽 뱃지 + 난이도 별 + stemPreview (1줄) + ChevronRight
- 클릭 -> `/questions/{questionUuid}`
- `questions`가 빈 배열이면: 섹션 숨김

---

### 3.5 합격 준비도 (Readiness) -- BE 구현 완료

> BE에 `ReadinessCalculator`, `ToneKeyResolver`, `ReadinessConstants` 이미 배포됨.
> `GET /progress` 응답에 `readiness` 블록이 **항상 포함**됨 (non-nullable).

**요청** (기존 API, 변경 없음)
```
GET /api/progress?memberUuid={uuid}
```

**현재 응답 (readiness 포함)**
```json
{
  "solvedCount": 42,
  "correctRate": 0.68,
  "streakDays": 7,
  "readiness": {
    "score": 0.42,
    "accuracy": 0.68,
    "coverage": 0.55,
    "recency": 0.85,
    "lastStudiedAt": "2026-04-09T22:13:00",
    "recentAttemptCount": 37,
    "coveredTopicCount": 6,
    "activeTopicCount": 11,
    "daysUntilExam": 27,
    "toneKey": "STEADY"
  }
}
```

**FE 타입 추가 필요** (`types/api.ts`)
```typescript
// 신규 추가
export type ToneKey = "NO_EXAM" | "ONBOARDING" | "POST_EXAM" | "TODAY" | "SPRINT" | "PUSH" | "STEADY" | "EARLY";

export interface ReadinessResponse {
  readonly score: number;           // 0.00~1.00
  readonly accuracy: number;        // 0.00~1.00
  readonly coverage: number;        // 0.00~1.00
  readonly recency: number;         // 0.70~1.00
  readonly lastStudiedAt: string | null;  // ISO-8601, 미시도면 null
  readonly recentAttemptCount: number;    // 0~50
  readonly coveredTopicCount: number;
  readonly activeTopicCount: number;
  readonly daysUntilExam: number | null;  // 시험 미선택이면 null
  readonly toneKey: ToneKey;
}

// 기존 ProgressResponse 수정 (readiness는 항상 존재)
export interface ProgressResponse {
  readonly solvedCount: number;
  readonly correctRate: number;
  readonly streakDays: number;
  readonly readiness: ReadinessResponse;
}
```

**scoreBand 판정 (FE 구현)**
```typescript
type ScoreBand = "LOW" | "MID" | "HIGH";

function getScoreBand(score: number): ScoreBand {
  if (score < 0.30) return "LOW";
  if (score < 0.70) return "MID";
  return "HIGH";
}
```

**toneKey x scoreBand 카피 매트릭스 (FE 관리)**

FE에서 `(toneKey, scoreBand)` 조합 = 8 x 3 = **24칸** 카피를 관리한다.
별도 파일(예: `src/constants/readinessCopy.ts`)에 모아두는 것을 권장.

```typescript
// 예시 구조
const READINESS_COPY: Record<ToneKey, Record<ScoreBand, string>> = {
  STEADY: {
    LOW: "꾸준히 하고 있어요, 조금만 더 넓혀보세요",
    MID: "안정적으로 준비하고 있어요",
    HIGH: "합격이 눈앞이에요, 이 페이스 유지하세요",
  },
  SPRINT: {
    LOW: "막판 스퍼트가 필요해요",
    MID: "마무리만 잘하면 돼요",
    HIGH: "거의 다 왔어요, 화이팅!",
  },
  // ... 나머지 6개 toneKey
};
```

**렌더링**
- `readiness.score`를 홈 최상단 게이지로 표시 (스크린샷의 "합격 준비도 42%")
- 프로그레스 바: `width: ${readiness.score * 100}%`
- 카피 텍스트: `READINESS_COPY[readiness.toneKey][getScoreBand(readiness.score)]`
- 3요소 세부: 정확도(`accuracy`) / 커버리지(`coverage`) / 최근성(`recency`) 표시
  - `정확도 ${Math.round(accuracy * 100)}%`
  - `커버리지 ${Math.round(coverage * 100)}%`
  - `최근성 ${Math.round(recency * 100)}%`
- **정직 모드**: 5%든 10%든 크게 보여야 "출발선"으로 느껴짐 (구석에 작게 두지 말 것)

---

## 4. 학습 히트맵 캘린더 (이슈 #42)

### 4.1 API 스펙

**요청**
```
GET /api/progress/heatmap?memberUuid={uuid}&from={date}&to={date}
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `memberUuid` | UUID (query) | O | 회원 식별자 |
| `from` | LocalDate (query) | X | 조회 시작일 (기본: 30일 전) |
| `to` | LocalDate (query) | X | 조회 종료일 (기본: 오늘) |

**응답**
```json
{
  "entries": [
    { "date": "2026-04-01", "solvedCount": 3, "correctCount": 2 },
    { "date": "2026-04-02", "solvedCount": 5, "correctCount": 4 },
    { "date": "2026-04-05", "solvedCount": 1, "correctCount": 0 }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `date` | string (LocalDate) | 날짜 |
| `solvedCount` | int | 해당 날짜 풀이 수 |
| `correctCount` | int | 해당 날짜 정답 수 |

- 풀이 기록이 없는 날짜는 배열에서 **제외** (sparse array)
- `from > to`이면 빈 배열 반환
- BE 내부: `submission` 테이블에서 `DATE(submitted_at)` 기준 `GROUP BY` 집계

### 4.2 FE 타입 추가 (`types/api.ts`)

```typescript
export interface HeatmapEntry {
  readonly date: string;        // "2026-04-01" (LocalDate)
  readonly solvedCount: number;
  readonly correctCount: number;
}

export interface HeatmapResponse {
  readonly entries: readonly HeatmapEntry[];
}
```

### 4.3 API 함수 추가 (`api/progress.ts`)

```typescript
import type { HeatmapResponse } from "../types/api";

export function fetchHeatmap(
  memberUuid: string,
  from?: string,
  to?: string,
): Promise<HeatmapResponse> {
  const query = new URLSearchParams();
  query.set("memberUuid", memberUuid);
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return apiFetch(`/progress/heatmap?${query}`);
}
```

### 4.4 Hook 생성 (`hooks/useHeatmap.ts`)

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchHeatmap } from "../api/progress";
import { useMemberStore } from "../stores/memberStore";

export function useHeatmap(from?: string, to?: string) {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    queryKey: ["heatmap", uuid, from, to],
    queryFn: () => fetchHeatmap(uuid, from, to),
    staleTime: 5 * 60 * 1000,  // 5분
  });
}
```

### 4.5 히트맵 렌더링 가이드

**색상 단계 (Design.md 기준, `solvedCount` 기준)**

| 단계 | 조건 | 색상 | Tailwind |
|------|------|------|----------|
| Level 0 | 0문제 (entries에 없는 날짜) | `#F5F5F5` | `bg-[#F5F5F5]` |
| Level 1 | 1문제 | `#EEF2FF` | `bg-[#EEF2FF]` |
| Level 2 | 2-3문제 | `#C7D2FE` | `bg-[#C7D2FE]` |
| Level 3 | 4-5문제 | `#818CF8` | `bg-[#818CF8]` |
| Level 4 | 6문제+ | `#4F46E5` | `bg-brand` |

**레벨 판정 함수 (FE에서 구현)**
```typescript
function getHeatmapLevel(solvedCount: number): 0 | 1 | 2 | 3 | 4 {
  if (solvedCount === 0) return 0;
  if (solvedCount === 1) return 1;
  if (solvedCount <= 3) return 2;
  if (solvedCount <= 5) return 3;
  return 4;
}
```

> 이 함수는 단순 UI 매핑이므로 "프론트 비즈니스 로직 금지" 원칙에 해당하지 않음.

**캘린더 구성**
- 스크린샷 기준: 7열(일~토) x 4~5행 그리드
- 각 셀: 날짜 숫자 + 배경색 (Level 0~4)
- entries는 sparse array이므로, 날짜 범위를 FE에서 루프 돌면서 entries에 해당 날짜가 있는지 `Map<string, HeatmapEntry>`로 조회
- 하단 범례: 5단계 색상 칩 + "0" ~ "6+" 텍스트

**sparse array -> Map 변환 패턴**
```typescript
const entryMap = new Map(
  heatmap.entries.map((e) => [e.date, e])
);

// 특정 날짜의 solvedCount 조회
const entry = entryMap.get("2026-04-05");
const level = getHeatmapLevel(entry?.solvedCount ?? 0);
```

**호출 시점**
- 홈 진입 시 다른 API와 병렬 호출
- `from`/`to` 미지정: 백엔드가 최근 30일 기본 적용
- 히트맵 캘린더에서 월 이동 시: `from`/`to`를 해당 월 범위로 지정하여 재호출

**에러 처리**
- 실패 시 히트맵 섹션 숨김 (graceful)

---

## 5. Hook 생성 가이드

신규 Hook 5개를 생성해야 한다. 모두 `src/hooks/` 디렉토리에 배치.

| 파일명 | queryKey | staleTime | 비고 |
|--------|----------|-----------|------|
| `useGreeting.ts` | `["greeting", uuid]` | 5분 | uuid 변경 시 refetch |
| `useTodayQuestion.ts` | `["todayQuestion", uuid]` | 24시간 | 하루 1문제 |
| `useSelectedSchedule.ts` | `["selectedSchedule"]` | 1시간 | 시험 일정 자주 안 바뀜 |
| `useRecommendations.ts` | `["recommendations"]` | 5분 | 새로고침마다 다른 문제 |
| `useHeatmap.ts` | `["heatmap", uuid, from, to]` | 5분 | 월 이동 시 from/to 변경 |

### 패턴 (기존 useProgress.ts 참고)

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchXxx } from "../api/xxx";
import { useMemberStore } from "../stores/memberStore";

export function useXxx() {
  const uuid = useMemberStore((s) => s.uuid);  // 필요한 경우만
  return useQuery({
    queryKey: ["xxx", uuid],  // uuid가 필요한 경우만 포함
    queryFn: () => fetchXxx(uuid),
    staleTime: N,
  });
}
```

---

## 6. Home.tsx 수정 가이드

### 6.1 import 추가

```typescript
import { useGreeting } from "../hooks/useGreeting";
import { useTodayQuestion } from "../hooks/useTodayQuestion";
import { useSelectedSchedule } from "../hooks/useSelectedSchedule";
import { useRecommendations } from "../hooks/useRecommendations";
import { useHeatmap } from "../hooks/useHeatmap";
```

### 6.2 데이터 가져오기

```typescript
export default function Home() {
  // 기존
  const { data: progress, isLoading, isError, refetch } = useProgress();
  useMember();

  // 신규 -- 각각 독립적으로 로딩/에러 처리
  const { data: greeting } = useGreeting();
  const { data: today } = useTodayQuestion();
  const { data: schedule } = useSelectedSchedule();
  const { data: recommendations } = useRecommendations();
  const { data: heatmap } = useHeatmap();  // 기본: 최근 30일

  // ... 기존 코드
}
```

### 6.3 섹션 배치 순서 (스크린샷 기준)

```
1. 인사말 영역        -- greeting?.message || 정적 텍스트
2. 오늘의 문제 카드    -- today?.question
3. 시험 D-day 카드    -- schedule (certType + round + examDate)
4. 학습 현황          -- streak + 히트맵 캘린더 (heatmap.entries)
5. 합격 준비도        -- progress.readiness.score
6. 추천 문제 리스트    -- recommendations?.questions
```

### 6.4 에러 처리 원칙

```
progress 실패     --> 전체 ErrorFallback (핵심 데이터)
greeting 실패     --> fallback 텍스트 사용 (조용히)
today 실패        --> 섹션 숨김
schedule 실패     --> 섹션 숨김
recommendations 실패 --> 섹션 숨김
heatmap 실패      --> 히트맵 섹션 숨김
```

**`progress`만 전체 에러 처리. 나머지는 graceful 숨김.**
**`readiness`는 `progress` 응답에 항상 포함됨 (non-nullable). progress 성공이면 readiness도 있음.**

---

## 7. 주의사항

1. **비즈니스 로직 프론트 금지**: D-day 계산, 정답 판정, 닉네임 생성 등 모든 로직은 백엔드 책임. 프론트는 응답을 그대로 렌더링.
2. **`apiFetch<T>()` 래퍼 필수**: `fetch()` 직접 호출 금지.
3. **아이콘은 lucide-react만**: 이모지 사용 금지.
4. **타입은 `readonly`**: 모든 응답 타입 필드에 `readonly` 필수.
5. **히트맵 색상**: Design.md에 정의된 5단계 색상 사용 (섹션 4 참고).
6. **BE API 6개 모두 구현 완료**: greeting, today, selected, recommendations, heatmap, readiness 전부 동작 중. FE 연동만 하면 됨.
7. **GreetingResponse 타입 수정 필수**: 현재 FE 타입에 `message`만 있으나 BE는 `nickname`, `message`, `messageType` 3필드를 내려줌.

---

## 8. 파일 체크리스트

### 신규 생성

| 파일 | 용도 |
|------|------|
| `src/hooks/useGreeting.ts` | 인사말 Hook |
| `src/hooks/useTodayQuestion.ts` | 오늘의 문제 Hook |
| `src/hooks/useSelectedSchedule.ts` | 시험 일정 Hook |
| `src/hooks/useRecommendations.ts` | 추천 문제 Hook |
| `src/hooks/useHeatmap.ts` | 히트맵 캘린더 Hook |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/Home.tsx` | 신규 Hook 연동 + 섹션 추가 |
| `src/types/api.ts` | `GreetingResponse`에 `nickname`, `messageType` 추가 / `HeatmapEntry`, `HeatmapResponse`, `ToneKey`, `ReadinessResponse` 신규 / `ProgressResponse`에 `readiness` 추가 |
| `src/api/progress.ts` | `fetchHeatmap()` 함수 추가 |
| `src/api/home.ts` | 기존 `fetchGreeting()` -- 변경 없음 (타입만 수정) |
