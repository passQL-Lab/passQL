# passQL 앱 PRD (API 상호작용 기준)

> 버전: 1.0 | 작성일: 2026-04-11 | 기준 API: be-api-docs.json v0.0.3

---

## 1. 서비스 개요

passQL은 SQLD/SQLP 자격증 취득을 목표로 하는 SQL 학습 앱입니다.  
사용자는 별도 회원가입 없이 디바이스 UUID로 식별되며, 문제 풀기 → 제출 → 피드백 → 통계 확인의 핵심 루프를 반복합니다.

---

## 2. 사용자 식별 흐름

앱 최초 실행 시 UUID 발급 및 저장:

```
앱 최초 실행
  └─ POST /members/register
       └─ 응답: { memberUuid } → 디바이스 로컬 저장 (memberStore)
```

이후 모든 인증 필요 요청에 `X-Member-UUID` 헤더 또는 `?memberUuid` 쿼리 파라미터 포함.

---

## 3. 화면별 API 상호작용

### 3-1. 홈 화면 (`/`)

**병렬 호출** — 화면 진입 즉시 동시 호출:

| 호출 순서 | API                                     | 목적        | 화면 구성요소                    |
| --------- | --------------------------------------- | ----------- | -------------------------------- |
| 병렬 1    | `GET /members/me?memberUuid`            | 닉네임 조회 | 상단 인사말 `{nickname}`         |
| 병렬 2    | `GET /home/greeting?memberUuid`         | 인사 메시지 | 인사말 + messageType 배지        |
| 병렬 3    | `GET /progress?memberUuid`              | 학습 현황   | 합격 준비도 카드, 연속 학습 뱃지 |
| 병렬 4    | `GET /questions/today?memberUuid`       | 오늘의 문제 | 데일리 챌린지 카드               |
| 병렬 5    | `GET /questions/recommendations?size=3` | 추천 문제   | 추천 문제 리스트 (3개)           |
| 병렬 6    | `GET /exam-schedules/selected`          | 시험 일정   | 시험 D-day 카드                  |
| 병렬 7    | `GET /progress/heatmap?memberUuid`      | 학습 히트맵 | 캘린더 히트맵 (현재 미구현→mock) |

**홈 구성요소 상세:**

```
홈 화면
├── [인사 섹션]
│     ├── 인사 메시지 (greeting.message, {nickname} 치환)
│     └── messageType별 서브 텍스트
│           - EXAM_DAY: "오늘 시험이에요!"
│           - URGENT: "시험이 얼마 남지 않았어요"
│
├── [2열 카드 그리드]
│     ├── 오늘의 문제 카드
│     │     - today.question 있으면: stemPreview + topicName + 난이도별 별표
│     │     - alreadySolvedToday=true면 "(완료)" 표시
│     │     - today.question=null이면: "문제 풀기" 링크 카드
│     └── 시험 일정 카드
│           - schedule 있으면: certType + round회 + examDate
│           - null이면: "선택된 일정 없음"
│
├── [학습 현황 카드]
│     ├── streakDays > 0이면 연속 학습 뱃지 (불꽃 아이콘)
│     └── 히트맵 캘린더 (heatmap.entries)
│
├── [합격 준비도 카드] — readiness 있을 때
│     ├── score (0~100% 게이지 바)
│     ├── toneKey별 코멘트 텍스트
│     └── accuracy / coverage / recency 세부 지표
│
├── [통계 2열 카드] — readiness 없을 때 fallback
│     ├── 푼 문제 수 (solvedCount)
│     └── 정답률 (correctRate → %, 게이지 바)
│
└── [추천 문제 리스트]
      └── recommendations.questions 배열
            각 카드: stemPreview + topicName + 난이도
```

---

### 3-2. 문제 목록 화면 (`/questions`)

**2단계 구조:**

**1단계 — 토픽 선택 화면:**

```
GET /meta/topics
  └─ isActive=true 필터 + sortOrder 정렬
  └─ 토픽 그리드 카드 렌더링 (displayName + 서브토픽 개수)
```

**2단계 — 토픽 선택 후 문제 목록:**

```
GET /questions?page={n}&size=10&topic={topicCode}&difficulty={1|2|3}
  └─ 페이지네이션: "더 보기" 버튼으로 page 증가
  └─ 필터: 난이도 드롭다운 (1~3)
  └─ 문제 카드: questionUuid(8자리) + stemPreview + topicName + difficulty
```

---

### 3-3. 문제 상세 + 풀기 화면 (`/questions/:questionUuid`)

**진입 시 API 호출:**

```
GET /questions/{questionUuid}
  └─ 응답: QuestionDetail
        ├── stem (문제 지문)
        ├── choiceSets[] (선택지 세트 배열)
        ├── executionMode: "EXECUTABLE" | "CONCEPT_ONLY"
        ├── schemaDisplay, schemaDdl, schemaSampleData (스키마 정보)
        └── topicName, difficulty
```

**선택지 존재 여부 분기:**

```
choiceSets[]에 status="OK" 항목 있음?
  ├─ YES → 선택지 바로 렌더링
  └─ NO  → SSE 선택지 자동 생성 시작
             SSE: POST /questions/{questionUuid}/generate-choices (EventStream)
               이벤트 흐름:
                 status → { type: "status", message: "선택지 생성 중..." }
                 complete → { type: "complete", choices: ChoiceItem[], choiceSetId }
                 error → { type: "error", code, retryable }
               UI 상태:
                 - 스피너 + sseStatus 메시지 표시
                 - error.retryable=true이면 "다시 시도" 버튼 표시
```

**선택지 클릭 시 (EXECUTABLE 모드):**

```
사용자가 선택지 클릭
  └─ 캐시 확인 (executeCache[choiceKey])
       ├─ 캐시 HIT → API 호출 없이 캐시 결과 바로 표시
       └─ 캐시 MISS → POST /questions/{questionUuid}/execute { sql }
                        ├─ 성공: 결과 테이블 인라인 표시 + 캐시 저장
                        └─ 실패 (result.errorCode 있음): 에러 카드 표시
                               └─ "AI에게 물어보기" 버튼 활성화
                                    POST /ai/explain-error { questionUuid, sql, errorMessage }
                                      └─ AI 해설 바텀시트 표시
```

**제출:**

```
"답안 제출하기" 버튼 클릭 (선택지 + choiceSetId 있어야 활성화)
  └─ POST /questions/{questionUuid}/submit
       Header: X-Member-UUID
       Body: { choiceSetId, selectedChoiceKey }
         └─ 응답: SubmitResult → navigate("/questions/{uuid}/result", state)
```

---

### 3-4. 정답/오답 피드백 화면 (`/questions/:questionUuid/result`)

> 이 화면은 API를 추가 호출하지 않습니다.  
> submit 응답 SubmitResult를 navigate state로 전달받아 렌더링합니다.

**구성요소:**

```
피드백 화면
├── 정답/오답 헤더 (isCorrect 기준)
├── 비교 섹션 (executionMode별 분기)
│     ├── EXECUTABLE: SQL 코드 + 실행 결과 테이블 비교
│     │     - 내가 선택한 SQL (오답일 때만)
│     │     - 정답 SQL
│     └── CONCEPT_ONLY: 텍스트 선택지 비교
├── 해설 (rationale)
├── [오답일 때만] "AI에게 자세히 물어보기" 버튼
│     └─ POST /ai/diff-explain { questionUuid, selectedChoiceKey }
│           └─ AI 해설 바텀시트 표시
└── 유사 문제 (비동기, 화면 진입 후 로드)
      GET /ai/similar/{questionUuid}?k=3
        └─ 유사 문제 카드 리스트
```

---

### 3-5. 연습 모드 (`/practice/:sessionId`)

연습 모드는 CategoryCards에서 토픽 선택 후 세션을 생성하여 진입합니다.

**세션 내 문제 풀기 (PracticeSet):**

```
각 문제 렌더링: QuestionDetail 컴포넌트 재사용
  └─ GET /questions/{questionUuid} (문제별 개별 호출)

선택지 제출:
  POST /questions/{questionUuid}/submit
    Body: { choiceSetId, selectedChoiceKey }
    Header: X-Member-UUID
      └─ 결과: SubmitResult → PracticeFeedbackBar에 인라인 표시
      └─ 다음 문제로 이동 (navigate 없이 index 증가)

마지막 문제 제출 후:
  → navigate /practice/{sessionId}/result
```

**연습 결과 (PracticeResult):**

```
API 호출 없음 — practiceStore에 저장된 results 배열로 로컬 집계
  - correctCount, totalCount, totalDurationMs, avgDurationMs
  - 오답 문제 카드: 링크로 /questions/{uuid} 재도전 가능
```

---

### 3-6. 통계 화면 (`/stats`)

**진입 시 병렬 호출:**

| API                                   | 목적           | 화면 구성요소                                      |
| ------------------------------------- | -------------- | -------------------------------------------------- |
| `GET /progress?memberUuid`            | 전체 학습 현황 | 상단 요약 카드 (푼 문제 / 합격 준비도 / 연속 학습) |
| `GET /progress/categories?memberUuid` | 토픽별 정답률  | 레이더 차트, 막대 차트                             |
| `GET /progress/ai-comment?memberUuid` | AI 학습 코멘트 | AI 분석 카드 (Redis 24h 캐싱)                      |

---

### 3-7. 설정 화면 (`/settings`)

**진입 시 API 없음** — memberStore에서 로컬 읽기

**닉네임 재생성:**

```
RefreshCw 버튼 클릭
  └─ POST /members/me/regenerate-nickname
       Query: memberUuid
         └─ 응답: { nickname } → memberStore 업데이트
```

---

## 4. 전역 API 패턴

### 인증

- **헤더 방식** (`X-Member-UUID`): submit, execute, AI 해설 엔드포인트
- **쿼리 파라미터 방식** (`?memberUuid`): progress, greeting, me 등

### 에러 처리 계층

```
HTTP 에러 (ApiError)
  ├─ 400: 입력 오류 → 유효성 안내 메시지
  ├─ 401: 인증 실패 → 재등록 유도
  ├─ 404: 리소스 없음 → 뒤로 가기 유도
  ├─ 422: AI body 필드 오류 → 필드 오류 표시
  └─ 500: 서버 오류 → "잠시 후 다시 시도" 안내

비즈니스 에러 (HTTP 200 but errorCode 포함)
  └─ ExecuteResult.errorCode 있음 → SQL 실행 실패
       └─ errorMessage 표시 + "AI에게 물어보기" 버튼

타임아웃 (25초 AbortController)
  └─ "서버 응답 지연" 안내 + 재시도

SSE 에러
  └─ retryable=true → "다시 시도" 버튼
  └─ retryable=false → "선택지 생성에 실패했어요" 안내
```

### 캐싱 정책

| 데이터        | 캐시 전략                                                       |
| ------------- | --------------------------------------------------------------- |
| SQL 실행 결과 | 클라이언트 로컬 state (선택지별 캐시, 화면 이탈 시 소멸)        |
| 토픽 목록     | React Query staleTime 5분                                       |
| AI 코멘트     | React Query staleTime 1시간 (서버 Redis 24h)                    |
| 토픽별 분석   | React Query staleTime 5분                                       |
| SSE 선택지    | 화면 단위 state (재진입 시 재생성 없음, choiceSets 있으면 스킵) |

---

## 5. 핵심 API 호출 시퀀스 요약

### 문제 풀기 전체 시퀀스

```
[1] 화면 진입
    GET /questions/{questionUuid}

[2a] choiceSets 있음
     → 선택지 바로 표시

[2b] choiceSets 없음
     SSE /questions/{questionUuid}/generate-choices
     → status 이벤트 → 스피너 업데이트
     → complete 이벤트 → 선택지 표시

[3] 선택지 클릭 (EXECUTABLE 모드)
    POST /questions/{questionUuid}/execute { sql }
    → 성공: 결과 테이블 표시 + 캐시
    → 실패: 에러 카드 + [AI에게 물어보기]
         POST /ai/explain-error { questionUuid, sql, errorMessage }

[4] 제출
    POST /questions/{questionUuid}/submit { choiceSetId, selectedChoiceKey }
    → navigate to /result (state 전달)

[5] 피드백 화면 (API 없음, navigate state 렌더링)
    오답일 때 [AI에게 자세히 물어보기]
    POST /ai/diff-explain { questionUuid, selectedChoiceKey }

[6] 유사 문제 (비동기 로드)
    GET /ai/similar/{questionUuid}?k=3
```

### 홈 화면 전체 시퀀스

```
[1] 앱 진입 (최초 1회)
    POST /members/register → UUID 발급

[2] 홈 화면 진입 (병렬 7개)
    ├─ GET /members/me?memberUuid
    ├─ GET /home/greeting?memberUuid
    ├─ GET /progress?memberUuid
    ├─ GET /questions/today?memberUuid
    ├─ GET /questions/recommendations?size=3
    ├─ GET /exam-schedules/selected
    └─ GET /progress/heatmap?memberUuid
```

---

## 6. 미구현 API (현재 Mock 처리)

| API                     | 상태   | 처리 방식        |
| ----------------------- | ------ | ---------------- |
| `GET /progress/heatmap` | 미구현 | mock 데이터 반환 |

---

## 7. 향후 앱화 고려사항

- **오프라인 지원**: 문제 목록 및 문제 상세를 로컬 캐싱하여 네트워크 없이 열람 가능하도록
- **푸시 알림**: 데일리 챌린지 알림, 시험 D-day 카운트다운 알림
- **딥링크**: `/questions/{uuid}` 딥링크로 특정 문제 직접 진입
- **SSE 재연결**: 앱 백그라운드 복귀 시 SSE 스트림 자동 재연결
