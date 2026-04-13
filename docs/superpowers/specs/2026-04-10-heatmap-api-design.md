# 날짜별 학습 기록 히트맵 API 설계

- **이슈**: #42
- **담당**: BE @Cassiiopeia, FE @EM-H20
- **작성일**: 2026-04-10

## 목적

프론트 홈 화면의 학습 히트맵 캘린더(GitHub 잔디 스타일, 모바일 최적화)를 위해 날짜별 학습 기록을 조회하는 API를 추가한다.

## API 스펙

### Request

```
GET /api/progress/heatmap?memberUuid={uuid}&from={date}&to={date}
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| memberUuid | UUID (query) | O | 회원 식별자 |
| from | LocalDate (query) | X | 조회 시작일 (기본: 30일 전) |
| to | LocalDate (query) | X | 조회 종료일 (기본: 오늘) |

### Response

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
| date | string (LocalDate) | 날짜 |
| solvedCount | int | 해당 날짜 풀이 수 |
| correctCount | int | 해당 날짜 정답 수 |

- 풀이 기록이 없는 날짜는 배열에서 제외 (sparse array)

## 아키텍처

### 접근 방식

기존 ProgressController/Service에 엔드포인트 추가 (접근 A). 히트맵은 Progress 도메인의 하위 기능으로 자연스럽게 속한다.

### 변경 파일

| 파일 | 모듈 | 변경 | 설명 |
|------|------|------|------|
| `HeatmapEntry.java` | PQL-Domain-Submission | 신규 | DTO record (date, solvedCount, correctCount) |
| `HeatmapResponse.java` | PQL-Domain-Submission | 신규 | DTO record (List<HeatmapEntry> entries) |
| `SubmissionRepository.java` | PQL-Domain-Submission | 수정 | 네이티브 쿼리 추가 |
| `ProgressService.java` | PQL-Domain-Submission | 수정 | getHeatmap() 메서드 추가 |
| `ProgressController.java` | PQL-Web | 수정 | @GetMapping("/heatmap") 추가 |
| `ProgressControllerDocs.java` | PQL-Web | 수정 | Swagger 문서 + @ApiLog 추가 |

### Entity 변경: 없음

기존 Submission 엔티티의 `memberUuid`, `submittedAt`, `isCorrect` 필드를 그대로 활용. Flyway 마이그레이션 불필요.

### Repository 쿼리

```sql
SELECT DATE(s.submitted_at) AS date,
       COUNT(*)              AS solved_count,
       SUM(s.is_correct)     AS correct_count
FROM submission s
WHERE s.member_uuid = :memberUuid
  AND s.submitted_at >= :fromDate
  AND s.submitted_at < :toDateExclusive
GROUP BY DATE(s.submitted_at)
ORDER BY date ASC
```

- 기존 인덱스 `idx_submission_member_submitted` (`member_uuid, submitted_at`) 활용
- `to` 파라미터는 해당일 포함을 보장하기 위해 Service에서 `to + 1일`의 시작시각으로 변환 (exclusive upper bound)
- 네이티브 쿼리 사용 — 프로젝트 컨벤션과 일치 (calculateCorrectRateByMemberUuid, countDistinctRecentActiveTopicsByMemberUuid 선례)

### 에러 처리

- `memberUuid` 미존재 → `CustomException(ErrorCode.MEMBER_NOT_FOUND)` (기존 getProgress 패턴 동일)
- `from > to` → 빈 배열 반환

## 프론트 활용 (참고)

| 단계 | 조건 | 색상 |
|------|------|------|
| Level 0 | 0문제 | #F5F5F5 |
| Level 1 | 1문제 | #EEF2FF |
| Level 2 | 2-3문제 | #C7D2FE |
| Level 3 | 4-5문제 | #818CF8 |
| Level 4 | 6문제+ | #4F46E5 |
