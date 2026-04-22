# 홈 진도율을 합격 준비도(Readiness)로 대체 — FE 구현

### 📌 작업 개요

홈 화면의 `correctRate` 기반 진도율 progress 바를 `readiness.score` 기반 합격 준비도 게이지로 교체.  
무한 문제 환경에서 "전체 진도율" 개념이 성립하지 않는 문제를 해소하고, Readiness = Accuracy × Coverage × Recency 산식으로 "합격 가능성"을 직접 표현.

---

### 🎯 구현 목표

- `GET /progress` 응답에 추가된 `readiness` 블록 연동
- `toneKey` × `scoreBand` 24칸 카피 매트릭스로 D-day 맥락별 메시지 표시
- 3요소(정확도·커버리지·최근도) 드릴다운으로 점수 근거 투명화

---

### ✅ 구현 내용

#### 타입 정의 추가
- **파일**: `src/types/api.ts`
- `ToneKey` 유니온 타입 추가 (8종: NO_EXAM / ONBOARDING / POST_EXAM / TODAY / SPRINT / PUSH / STEADY / EARLY)
- `ReadinessResponse` 인터페이스 추가 (score, accuracy, coverage, recency, lastStudiedAt, recentAttemptCount, coveredTopicCount, activeTopicCount, daysUntilExam, toneKey)
- `ProgressSummary` → `ProgressResponse`로 개편, `readiness: ReadinessResponse | null` 필드 추가

#### API 연동 수정
- **파일**: `src/api/progress.ts`
- 인증 방식 오류 수정: `X-User-UUID` 헤더 → `?memberUuid=` 쿼리 파라미터 (스펙 불일치 수정)
- `fetchHeatmap(memberUuid, from?, to?)` 시그니처로 변경

#### 합격 준비도 카피 매트릭스
- **파일**: `src/constants/readinessCopy.ts` (신규)
- `ScoreBand` (low / mid / high) × `ToneKey` (8종) = 24칸 매트릭스
- `getReadinessCopy(toneKey, score)` 함수로 상황별 카피 반환

#### 홈 화면 Readiness 카드
- **파일**: `src/pages/Home.tsx`
- `readiness` 존재 시: 점수(%) + 게이지 바 + toneKey 카피 + 3요소 드릴다운 카드 표시
- `readiness` null 시: 기존 푼문제/정답률 2-column 그리드 폴백
- 인사 메시지: `fetchGreeting` API 연동 (`messageType` 기반 서브 텍스트 분기)
- 오늘의 문제, 시험 일정, 학습 현황 히트맵, 추천 문제 섹션 추가

#### 신규 컴포넌트/훅
- **`src/components/HeatmapCalendar.tsx`**: 최근 30일 학습 히트맵 (5단계 색상 레벨)
- **`src/hooks/useHome.ts`**: `useGreeting`, `useTodayQuestion`, `useRecommendations`, `useSelectedSchedule`, `useHeatmap` 훅 모듈화
- **`src/api/home.ts`**: `fetchGreeting` 엔드포인트
- **`src/api/examSchedules.ts`**: `fetchExamSchedules`, `fetchSelectedSchedule` 엔드포인트

---

### 🔧 주요 변경사항 상세

#### readiness 카드 조건부 렌더링
`progress?.readiness` null 체크로 readiness 미지원 응답에도 기존 UI 유지.  
score는 0.0~1.0 범위라 `Math.round(score * 100)`으로 % 변환 후 표시.

#### fetchProgress 인증 수정
기존 코드가 `X-User-UUID` 헤더로 인증을 시도했으나 실제 스펙은 쿼리 파라미터(`?memberUuid=`). 수정하지 않으면 progress 데이터 자체가 누락될 수 있었음.

#### HeatmapCalendar
`GET /progress/heatmap` 미구현 상태에서도 graceful하게 로딩 스피너로 대체되도록 처리.

---

### 🧪 검증

- `npm run build` 통과 (TypeScript 에러 없음)
- readiness null 케이스: 기존 정답률 카드 정상 표시 확인 (mock-data fallback)
- readiness 존재 케이스: 점수·게이지·카피·드릴다운 정상 렌더링 확인 (STEADY toneKey, score 0.52 기준)
