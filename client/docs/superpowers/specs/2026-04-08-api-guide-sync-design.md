# api-guide.md 동기화 스펙

> be-api-docs.json v0.0.3 (#22 Entity UUID 통일 + 신규 도메인) 기준으로 api-guide.md를 증분 업데이트한다.

## 변경 원인

백엔드 #22 이슈(Entity 스키마 보강, submission 테이블 및 question.is_active 컬럼 추가)로 인해 모든 Entity PK가 Long에서 UUID로 전환됨. 동시에 #23(시험 일정), #5(오늘의 문제) 등 신규 API가 추가됨.

## 변경 범위

대상 파일: `.claude/rules/api-guide.md` (1개)

## 변경 항목

### 1. 전역 치환

| 기존 | 변경 | 비고 |
|------|------|------|
| `X-User-UUID` | `X-Member-UUID` | 인증 헤더명 전체 변경 |
| `/questions/{id}` | `/questions/{questionUuid}` | path variable 전체 변경 |
| `/ai/similar/{questionId}` | `/ai/similar/{questionUuid}` | path variable 변경 |
| 엔드포인트 전체 목록 (15개) | 엔드포인트 전체 목록 (18개) | 총 개수 |

### 2. Questions 도메인

#### 기존 엔드포인트 수정

- `fetchQuestion(id)` -> `fetchQuestion(questionUuid)`: path variable 타입 Long -> UUID
- `submitAnswer(id, selectedKey)` -> `submitAnswer(questionUuid, selectedChoiceKey)`: path UUID + body 필드명 변경. 인증 방식 `O (header)` 명시. 구 필드명 `selectedKey` 한시적 fallback 주석 추가.
- `executeChoice(id, sql)` -> `executeChoice(questionUuid, sql)`: path UUID

#### 상태 변경

- `fetchTodayQuestion()`: 미구현 -> O. 응답 타입 `TodayQuestion` -> `TodayQuestionResponse`. `memberUuid` optional query param 추가. 설명 보강: 큐레이션 or 날짜 시드 폴백, `alreadySolvedToday` 필드, 활성 문제 0개 시 `{ question: null, alreadySolvedToday: false }`.

#### 신규 엔드포인트

- `fetchRecommendations(size?, excludeQuestionUuid?)`: GET `/questions/recommendations`. 인증 불필요. 응답 `RecommendationsResponse`. 설명: 활성 문제 풀에서 랜덤 N개, size 기본 3 최대 5, excludeQuestionUuid 미지정 시 데일리 챌린지 자동 제외.

### 3. AI 도메인

- 인증 방식: 테이블에 `O (header)` 명시 (기존에는 `O`만 표기)
- `explainError` body 스펙: `question_id`(integer) -> `questionUuid`(UUID). `user_uuid` 필드 제거 (헤더 `X-Member-UUID`로 대체).
- `diffExplain` body 스펙: 프론트 전달 필드에서 `question_id` -> `questionUuid` 반영.
- `fetchSimilar`: path `/{questionId}` -> `/{questionUuid}`

### 4. Progress 도메인

- `fetchProgress()`: 인증 방식 `O (header)` -> `O (query param)`. 파라미터 `memberUuid` 추가. 응답 타입 `ProgressSummary` -> `ProgressResponse`. 응답 필드 설명 추가: `solvedCount`(int64, distinct questionUuid 기준), `correctRate`(double, 0.0~1.0 둘째자리 반올림, 마지막 시도 기준), `streakDays`(int32, 하루 그레이스).
- `fetchHeatmap()`: **삭제** (be-api-docs.json v0.0.3에서 제거됨)
- `fetchRecentWrong()`: **삭제** (백엔드에 정의된 적 없음)
- heatmap/recentWrong 관련 부연 설명도 삭제

### 5. 신규 도메인: Home

파일 위치: `src/api/home.ts`

| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchGreeting(memberUuid)` | GET | `/home/greeting?memberUuid` | O (query param) | `GreetingResponse` | O |

설명: 홈 화면 인사 메시지 반환. `GreetingResponse { message: string }`.

### 6. 신규 도메인: ExamSchedule

파일 위치: `src/api/examSchedules.ts`

| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchExamSchedules(certType?)` | GET | `/exam-schedules?certType` | - | `ExamScheduleResponse[]` | O |
| `fetchSelectedSchedule()` | GET | `/exam-schedules/selected` | - | `ExamScheduleResponse \| null` | O |

설명:
- `certType`: SQLD / SQLP 필터. 미입력 시 전체 조회. certType + round 오름차순 정렬.
- `fetchSelectedSchedule`: `isSelected = true`인 단일 일정 반환. 선택된 일정 없으면 200 + null body.
- `ExamScheduleResponse { examScheduleUuid, certType, round, examDate, isSelected }`

### 7. 화면별 API 호출 흐름 업데이트

#### 홈 화면

```
진입 시 동시 호출:
- GET /members/me                → 닉네임
- GET /home/greeting             → 인사 메시지
- GET /progress?memberUuid       → 푼 문제, 정답률, 스트릭
- GET /questions/today           → 오늘의 문제 + 풀이 여부
- GET /questions/recommendations → 추천 문제
- GET /exam-schedules/selected   → 선택된 시험 일정
```

기존 대비 변경:
- `GET /questions/today` 추가 (미구현 -> 구현)
- `GET /questions/recommendations` 추가 (신규)
- `GET /home/greeting` 추가 (신규)
- `GET /exam-schedules/selected` 추가 (신규)
- `GET /progress/heatmap` 제거 (삭제됨)

#### 문제 상세 -> 결과

경로만 UUID 기반으로 변경. 흐름 구조 동일.

#### 결과 화면

유사 문제 경로만 UUID 기반으로 변경. 나머지 동일.

### 8. 코드 패턴 섹션

인증 헤더 예시만 업데이트:
```
headers: { "X-User-UUID": getMemberUuid() }
->
headers: { "X-Member-UUID": getMemberUuid() }
```

### 9. 에러 처리 섹션

변경 없음. 구조 및 패턴 그대로 유지.

## 변경하지 않는 것

- 아키텍처 다이어그램
- 코드 패턴 (헤더명 외)
- 에러 처리 패턴 및 규칙
- 비즈니스 에러 처리 패턴 (ExecuteResult)
- 422 Validation Error 처리
- 선택지 자동 실행 캐시 정책
