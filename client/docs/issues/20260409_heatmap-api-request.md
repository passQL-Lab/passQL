<!-- 제목: 🔧 [기능요청][BE] 날짜별 학습 기록 히트맵 API 요청 -->

## 📝 현재 문제점

- 프론트 홈 화면에 학습 히트맵 캘린더(GitHub 잔디 스타일)를 구현하려 하나, 날짜별 학습 기록을 조회하는 API가 없음
- 현재 `GET /progress`는 누적 통계(`solvedCount`, `correctRate`, `streakDays`)만 반환하며, 어떤 날짜에 몇 문제를 풀었는지는 알 수 없음
- 스트릭도 숫자(3일)만 제공되어 캘린더에 연속 학습일을 시각화할 수 없음

## 🛠️ 해결 방안 / 제안 기능

### 요청 API: `GET /progress/heatmap`

날짜별 학습 기록을 반환하는 엔드포인트 추가 요청.

**Request:**
```
GET /api/progress/heatmap?memberUuid={uuid}&from={date}&to={date}
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| `memberUuid` | UUID (query) | O | 회원 식별자 |
| `from` | LocalDate (query) | X | 조회 시작일 (기본: 30일 전) |
| `to` | LocalDate (query) | X | 조회 종료일 (기본: 오늘) |

**Response:**
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

- 풀이 기록이 없는 날짜는 배열에서 제외 (sparse array)
- Submission 테이블에서 `memberUuid` + `createdAt` 기준 GROUP BY date

### 프론트 활용 계획

1. **학습 히트맵 캘린더** — 날짜별 풀이 수를 색 농도(5단계)로 표시
2. **스트릭 시각화** — 연속 학습일을 캘린더에서 직접 확인
3. **주간/월간 통계** — 기간별 학습량 트렌드

### 히트맵 색상 단계 (Design.md 기준)

| 단계 | 조건 | 색상 |
|------|------|------|
| Level 0 | 0문제 | `#F5F5F5` |
| Level 1 | 1문제 | `#EEF2FF` |
| Level 2 | 2-3문제 | `#C7D2FE` |
| Level 3 | 4-5문제 | `#818CF8` |
| Level 4 | 6문제+ | `#4F46E5` |

## 🙋‍♂️ 담당자

- 백엔드: (확인 필요)
- 프론트엔드: EM-H20
