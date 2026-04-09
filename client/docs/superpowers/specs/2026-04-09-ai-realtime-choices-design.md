# AI 실시간 선택지 생성 기반 문제 풀이 코어 — 프론트엔드 스펙

> be-api-docs.json v0.0.3 기반 프론트 코드 위에, AI 실시간 선택지 생성 흐름을 얹는 설계.
> 챕터/진행 시스템은 별도 스펙으로 분리. 이 스펙은 "문제 1개를 푸는 흐름"에만 집중한다.

## 배경

passQL의 핵심 정체성은 "AI Agent가 매번 새로운 선택지를 생성하는 실행형 SQL 학습"이다. 현재 코드는 정적 선택지(`QuestionDetail.choices`) 기반 MVP 구현이며, 이를 실시간 생성 모델로 전환한다.

### 결정사항 (백엔드 팀 합의 1~12번)

1. 사용자 문제 진입 시 Gemini 호출로 선택지 4개 세트 실시간 생성 + 샌드박스 검증
2. 사용자가 문제 풀고 있는 동안 다음 문제용 세트를 미리 생성 (프리페치)
3. 첫 문제만 콜드 스타트 지연 감수, 두 번째부터 체감 지연 0
4. 문제(stem + DDL + 정답 기준)는 고정 — 관리자 등록, DB 영구 저장
5. 선택지 세트는 저장 — 사용자가 받은 세트의 히스토리 전부 보존
6. 관리자 화면에서 히스토리 조회/추적 (설계만, 구현 후순위)
7. 문제/선택지 신고 기능 (설계만, 구현 후순위)
8. AI 생성물은 틀릴 수 있다는 전제 — 식별/격리/재생성 훅 확보
9. 관리자 문제 등록 시에도 AI 활용 (stem 초안 생성)
10. 관리자는 검수 후 저장 (AI 초안 그대로 저장 금지)
11. 등록된 문제가 실시간 선택지 생성의 입력
12. 선택지 생성 프롬프트에 DB 스키마 정보 완전 전달

### 프론트-백엔드 합의사항

- API 2단계 분리: stem 조회와 선택지 생성 별도 요청
- SSE 스트리밍: 선택지 생성 진행 상태 실시간 push
- `choiceSetId`: 선택지 세트 식별자로 히스토리 추적
- 프리페치: 현재 문제 풀이 중 다음 문제 선택지 미리 생성

## 변경 범위

프론트 코드만. 백엔드 API 요구사항은 이 스펙에서 정의하고, 별도 이슈로 백엔드 팀에 전달.

## API 인터페이스 설계

### 1. 문제 조회 (기존 변경)

```
GET /questions/{questionUuid}
```

**변경점:** 응답에서 `choices` 필드 제거. stem + 메타데이터만 반환.

```typescript
// 응답
interface QuestionDetail {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly subtopicName: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly stem: string;
  readonly schemaDisplay: string;
  // choices 없음
}
```

### 2. 선택지 생성 (SSE 스트리밍, 신규)

```
POST /questions/{questionUuid}/generate-choices
Headers: X-Member-UUID, Accept: text/event-stream
```

서버가 SSE 스트림으로 응답:

```
event: status
data: {"phase":"generating","message":"선택지 생성 중..."}

event: status
data: {"phase":"validating","message":"SQL 실행 검증 중..."}

event: complete
data: {"choiceSetId":"cs-uuid-xxx","choices":[...]}

--- 또는 ---

event: error
data: {"code":"GENERATION_FAILED","message":"선택지 생성에 실패했습니다","retryable":true}
```

**SSE 이벤트 타입:**

| event | phase | 의미 |
|-------|-------|------|
| `status` | `generating` | AI가 선택지 텍스트 생성 중 |
| `status` | `validating` | 생성된 SQL을 샌드박스에서 실행 검증 중 |
| `complete` | — | 생성 완료, choices + choiceSetId 포함 |
| `error` | — | 생성 실패, retryable이면 재시도 가능 |

**complete 이벤트 data 스키마:**

```typescript
interface ChoiceSetComplete {
  readonly choiceSetId: string;
  readonly choices: readonly ChoiceItem[];
}
```

### 3. 제출 (choiceSetId 추가)

```
POST /questions/{questionUuid}/submit
Headers: X-Member-UUID
Body: { "choiceSetId": "cs-uuid-xxx", "selectedChoiceKey": "A" }
→ SubmitResult
```

기존 대비 `choiceSetId` 필드 추가. 어떤 선택지 세트에서 답했는지 추적.

### 4. SQL 실행 (변경 없음)

```
POST /questions/{questionUuid}/execute
Body: { "sql": "..." }
→ ExecuteResult
```

선택지 내 SQL 실행은 기존과 동일.

## 프론트엔드 흐름

### 문제 풀이 시퀀스

```
1. 화면 진입
   → GET /questions/{questionUuid}
   → stem + DDL 즉시 표시
   → 선택지 영역: 스켈레톤 + phase 메시지 표시

2. 선택지 생성
   → POST /questions/{questionUuid}/generate-choices (SSE)
   → status 이벤트마다 phase 메시지 업데이트
     "선택지 생성 중..." → "SQL 실행 검증 중..."
   → complete 이벤트 수신 → 선택지 4개 렌더링
   → choiceSetId를 state에 보관

3. 선택지 클릭 (EXECUTABLE 모드)
   → POST /questions/{questionUuid}/execute (기존과 동일)
   → 결과 테이블 or 에러 표시

4. 제출
   → POST /questions/{questionUuid}/submit
     body: { choiceSetId, selectedChoiceKey }
   → 결과 화면으로 이동

5. 프리페치 (선택지 클릭 시점에 트리거)
   → 다음 문제 uuid를 알고 있으면
   → POST /questions/{nextUuid}/generate-choices 백그라운드 호출
   → complete 이벤트 수신 시 캐시에 저장
   → "다음 문제" 이동 시 캐시 히트 → 즉시 표시
```

### 에러 처리

| 상황 | 처리 |
|------|------|
| SSE `error` (retryable: true) | "선택지 생성에 실패했습니다" + 재시도 버튼 |
| SSE `error` (retryable: false) | "일시적인 문제가 발생했습니다" + 문제 목록으로 돌아가기 |
| SSE 연결 끊김 | 자동 재시도 1회, 실패 시 재시도 버튼 |
| 타임아웃 (15초 이상 응답 없음) | "생성이 예상보다 오래 걸리고 있습니다" + 재시도 버튼 |
| 프리페치 실패 | 무시 (다음 문제 진입 시 새로 생성) |

### 프리페치 전략

- **트리거 시점:** 사용자가 선택지를 클릭한 시점 (풀이에 진입했다는 신호)
- **다음 문제 결정:** 추천 문제 API(`GET /questions/recommendations`)로 다음 문제 uuid 확보. 1개만 프리페치.
- **캐시:** `Map<questionUuid, ChoiceSetComplete>`로 메모리 보관. 페이지 이동 시 캐시 히트 확인.
- **캐시 수명:** 세션 동안 유지. 새로고침 시 소멸 (선택지는 매번 새로 생성이 원칙).
- **실패 시:** 무시. 다음 문제 진입 시 콜드 스타트로 폴백.

## 타입 변경

### 변경되는 타입

```typescript
// QuestionDetail에서 choices 제거
interface QuestionDetail {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly subtopicName: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly stem: string;
  readonly schemaDisplay: string;
  // choices 제거됨 — generate-choices로 별도 수신
}
```

### 신규 타입

```typescript
// SSE 이벤트 타입
type ChoiceGenerationPhase = "generating" | "validating";

interface ChoiceGenerationStatus {
  readonly phase: ChoiceGenerationPhase;
  readonly message: string;
}

interface ChoiceSetComplete {
  readonly choiceSetId: string;
  readonly choices: readonly ChoiceItem[];
}

interface ChoiceGenerationError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

// 제출 body 변경
interface SubmitPayload {
  readonly choiceSetId: string;
  readonly selectedChoiceKey: string;
}
```

## 파일 변경 목록

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/types/api.ts` | Modify | QuestionDetail에서 choices 제거, 신규 SSE 타입 추가 |
| `src/api/questions.ts` | Modify | `generateChoices()` SSE 함수 추가, `submitAnswer` body에 choiceSetId 추가 |
| `src/api/mock-data.ts` | Modify | generate-choices mock 추가 (SSE 시뮬레이션) |
| `src/hooks/useQuestionDetail.ts` | Modify | choices 분리, `useGenerateChoices` 훅 추가 |
| `src/hooks/usePrefetch.ts` | Create | 프리페치 로직 (다음 문제 선택지 미리 생성) |
| `src/pages/QuestionDetail.tsx` | Modify | SSE 상태 표시 UI, 선택지 로딩 스켈레톤, 에러/재시도 |
| `src/pages/AnswerFeedback.tsx` | Modify | state에 choiceSetId 추가 |
| `src/components/ChoiceCard.tsx` | Minor | props 변경 없음, 기존 유지 |
| `src/components/ChoicesSkeleton.tsx` | Create | 선택지 생성 중 스켈레톤 + phase 메시지 컴포넌트 |

## UX 상세

### 선택지 생성 중 화면

```
[stem 카드 — 즉시 표시]
[스키마 보기 토글 — 즉시 표시]

[────────────────────────────]
[  선택지 생성 중...           ]  ← phase 메시지 (animate)
[  ▓▓▓▓▓▓▓░░░░░░░░  42%     ]  ← 불확정 프로그레스 (pulse 애니메이션)
[────────────────────────────]
[  스켈레톤 카드 A             ]  ← animate-pulse
[  스켈레톤 카드 B             ]
[  스켈레톤 카드 C             ]
[  스켈레톤 카드 D             ]
```

- phase가 `generating` → `validating`으로 바뀌면 메시지 업데이트
- complete 수신 시 스켈레톤 → 실제 선택지로 교체 (fade-in 트랜지션)
- 프로그레스 바는 불확정(indeterminate) — 실제 진행률을 알 수 없으므로 pulse 애니메이션

### 에러 시 화면

```
[stem 카드 — 유지]

[────────────────────────────]
[  선택지 생성에 실패했습니다    ]
[  [다시 시도]                ]  ← btn-primary
[────────────────────────────]
```

### 프리페치 성공 시

다음 문제 진입 → stem 표시와 동시에 캐시된 선택지 즉시 렌더링. 스켈레톤 없이 바로 표시.

## 변경하지 않는 것

- 문제 목록 페이지 (`Questions.tsx`) — 변경 없음
- 홈 페이지 (`Home.tsx`) — 변경 없음
- 통계 페이지 (`Stats.tsx`) — 변경 없음
- 설정 페이지 (`Settings.tsx`) — 변경 없음
- AI 해설 흐름 (`explainError`, `diffExplain`) — 기존 유지
- 라우팅 구조 — 기존 유지

## 백엔드 API 요구사항 (이슈로 전달)

백엔드 팀에 전달할 API 요구사항:

1. `GET /questions/{questionUuid}` 응답에서 `choices` 필드 제거 (또는 null 반환)
2. `POST /questions/{questionUuid}/generate-choices` SSE 엔드포인트 신규 구현
   - `status` 이벤트: phase(generating/validating) + message
   - `complete` 이벤트: choiceSetId + choices 배열
   - `error` 이벤트: code + message + retryable
3. `POST /questions/{questionUuid}/submit` body에 `choiceSetId` 필수 추가
4. `choiceSetId`로 선택지 세트 히스토리 저장 (결정사항 5번)
