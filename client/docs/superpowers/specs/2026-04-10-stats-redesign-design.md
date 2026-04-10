# Stats 페이지 리디자인

## 배경

기존 3D/2D 차트를 삭제하고, 프로그래머스 AI 평가 리포트 스타일의 통계 페이지로 재구성한다.

## 레이아웃 구성

### 1. 상단 요약 카드 (기존 유지)

- 3열 카드: 푼 문제 / 정답률 / 연속 학습
- 데이터: `ProgressResponse` (solvedCount, correctRate, streakDays)

### 2. 카테고리별 레이더 차트

- `CategoryStats[]`의 각 카테고리를 꼭짓점으로 하는 레이더(스파이더) 차트
- 축 값: 정답률(0~100%)
- 카테고리 이름은 꼭짓점 라벨로 표시
- 라이브러리: `recharts` (RadarChart, PolarGrid, PolarAngleAxis)
- 디자인: card-base 안에 배치, 브랜드 인디고(#4F46E5) fill, 20% opacity

### 3. 카테고리 리스트

- 각 카테고리별 한 줄: 이름 + 정답률 바 + 풀이 수
- 정답률 바: 색상은 기존 로직(80%+ 초록, 60%+ 인디고, 40%+ 주황, 미만 빨강)
- 클릭 시 해당 카테고리 연습 시작 (기존 `handleCategoryClick` 동작 유지)

## 파일 구조

| 파일 | 상태 | 역할 |
|------|------|------|
| `src/pages/Stats.tsx` | 수정 | 새 레이아웃으로 재구성 |
| `src/components/StatsRadarChart.tsx` | 신규 | 레이더 차트 컴포넌트 |
| `src/components/StatsCategoryList.tsx` | 신규 | 카테고리 리스트 컴포넌트 |

## 사용 가능한 데이터

- `fetchProgress()` -> `ProgressResponse { solvedCount, correctRate, streakDays }`
- `fetchCategoryStats()` -> `CategoryStats[] { code, displayName, correctRate, solvedCount }`

## 스코프 외

- AI 종합 분석 (백엔드 미구현)
- 종합 점수 추이 차트 (히스토리 데이터 없음)
