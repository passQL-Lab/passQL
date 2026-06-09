# 프론트 화면 명세 및 API 매핑

## 개요

디자인 시안(9장)을 기준으로 실제 구현할 화면을 확정하고, 화면별 UI 요소·필요한 API·상태·잘라낼 항목을 정리한다. 디자인에 표시되었으나 5일 데드라인 내 데모에 기여하지 않거나 PRD 범위를 벗어나는 요소는 명시적으로 컷오프한다.

---

## 화면 인벤토리 (최종 5개)

| # | 화면 | 라우트 | 우선순위 |
|---|------|--------|---------|
| 1 | 홈 | `/` | P0 |
| 2 | 문제 목록 | `/questions` | P0 |
| 3 | 문제 상세 (풀이) | `/questions/:id` | P0 |
| 4 | 결과 (풀스크린) | `/questions/:id/result` 또는 모달 | P0 |
| 5 | 통계 | `/stats` | P1 |
| 6 | 설정 | `/settings` | P1 |

> 디자인에서 본 "노트 탭", "순위 탭", "내정보 탭", "Precision Study" 별도 모드, "알림 벨" — 전부 컷.

---

## 1. 홈 화면 (`/`)

### UI 요소
- 헤더: 로고("passQL"), 우측에 설정 아이콘 (벨 아이콘 컷)
- 인사말: "안녕하세요, {닉네임}"
- 스트릭 뱃지: "🔥 연속 N일"
- 오늘의 문제 카드
  - "오늘의 문제" 라벨
  - 문제 지문 1줄 (말줄임)
  - D-day 표시 (시험일까지)
  - [도전하기] 버튼 → `/questions/:id`
- 통계 카드 2개: 푼 문제 수, 정답률 (프로그레스바 포함)
- 추천 학습 / 취약 영역 리스트 (정답률 낮은 토픽 top 2)
  - 토픽 아이콘 + 토픽명 + 부제 + chevron
  - 클릭 시 해당 토픽으로 필터링된 문제 목록으로 이동

### 필요 API
| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/members/me?memberUuid=` | 닉네임 표시 |
| GET | `/api/progress?memberUuid=` | 푼 문제, 정답률, 스트릭 |
| GET | `/api/questions/today` | 오늘의 문제 (또는 클라에서 날짜 시드 + 전체 문제 ID 풀로 계산) |
| GET | `/api/progress/heatmap?memberUuid=` | 정답률 낮은 토픽 top 2 추출 |

### 상태
- TanStack Query: progress (staleTime 0, 진입 시 refetch)
- TanStack Query: today (staleTime: 24h)
- Zustand: memberStore (uuid, nickname)

### 컷오프
- 알림 벨 아이콘
- "Pro Plan" 뱃지 (디자인에 있던 사이드바 버전)

---

## 2. 문제 목록 화면 (`/questions`)

### UI 요소
- 헤더: "문제 목록" + 우측 "{N}문제" 카운터
- 필터 칩 3개
  - 토픽 (드롭다운)
  - 난이도 (드롭다운, 1~5)
  - 상태 (전체 / 미풀이 / 풀이완료 / 오답)
- 문제 카드 리스트 (무한 스크롤이 아닌 [더보기] 버튼)
  - Q번호 + 토픽 뱃지 + 난이도 별 표시
  - 문제 지문 (2줄 말줄임)
  - 정답률 (집계) + chevron
- [더보기] 버튼 (페이지네이션)

### 필요 API
| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/meta/topics` | 토픽 필터 옵션 |
| GET | `/api/questions?topic=&difficulty=&status=&page=&size=` | 페이징 리스트 |

### 상태
- URL search params로 필터 상태 보존 (뒤로가기 시 복원)
- TanStack Query: questions (staleTime 30s, 필터 변경 시 자동 refetch)

### 컷오프
- 무한 스크롤 (페이지 버튼만)
- 검색 (텍스트 검색)
- "정답률 N%" 집계가 백엔드에서 안 나오면 그냥 빼기

---

## 3. 문제 상세 화면 (`/questions/:id`)

### UI 요소
- 헤더: 뒤로가기 + 토픽 뱃지(JOIN 등) + 우측 난이도 별
- "QUESTION {N}" 라벨
- 지문 (StemCard)
- 스키마 정보 카드 (SchemaCard)
  - "Schema Information" 토글
  - 펼치면 테이블 목록 + DDL/예시 데이터
- 선택지 카드 4개 (A, B, C, D)
  - 선택지 라벨
  - 우측 상단: 실행 결과 뱃지 (SUCCESS / ERROR / 미실행)
  - SQL 코드 블록 (`<pre><code>`, D5에 CodeMirror 검토)
  - 실행 결과 영역 (인라인)
    - SUCCESS: 결과 테이블 (NAME, COUNT 등 동적 컬럼)
    - ERROR: 에러 코드 + 메시지 박스 + [AI에게 물어보기] 버튼
- 선택된 선택지는 보더 강조 + 체크 아이콘
- 하단 sticky [제출하기] 버튼

### 필요 API
| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/questions/{id}` | 문제 + 선택지 + 스키마 |
| POST | `/api/questions/{id}/execute` | 선택지별 SQL 실행 (자동 트리거) |
| POST | `/api/ai/explain-error` | 에러 시 AI 해설 |
| POST | `/api/questions/{id}/submit` | 제출 → 결과 화면 |

### 상호작용 흐름
1. 화면 진입 → `GET /api/questions/{id}`
2. 사용자가 선택지 라디오 클릭 → **즉시 해당 선택지 execute 자동 호출**
3. SUCCESS면 결과 테이블, ERROR면 에러 코드/메시지 박스를 인라인 표시 (디자인 7번)
4. 같은 선택지를 다시 누르면 캐시된 결과 재표시 (재호출 방지)
5. 다른 선택지 클릭 시 동일하게 execute
6. ERROR 시 [AI에게 물어보기] → explain-error 호출
7. [제출하기] → submit → 결과 화면 이동

> **결정 확정**: 선택지 클릭 시 자동 execute
> - 사유: 사용자가 즉각적으로 SQL 결과를 체감해야 학습 효과가 큼. 실패 시 에러를 바로 보여줘 실습적 상호작용 강화.
> - 부하 대응: 동일 선택지 재호출 방지(클라 캐시), 레이트리밋 `ratelimit.execute.per_minute`를 적정값(60→90 등)으로 어드민에서 조정 가능

### 상태
- TanStack Query: question detail (staleTime 0)
- 로컬 useState: 선택지별 실행 결과 맵 `Record<choiceKey, ExecuteResult>`
- 로컬 useState: 선택된 choiceKey

### 컷오프
- "Schema Information" 토글 — 일단 항상 펼친 상태로 표시
- CodeMirror 6 (D5로 미룸)

---

## 4. 결과 화면 (풀스크린)

> 디자인에 3가지 변형(이미지 8 bottom sheet, 11 풀스크린 오답, 14 풀스크린 정답)이 있음. **풀스크린 통일** (sheet 컷).

### UI 요소 (오답 케이스)
- 헤더: X 닫기 + "Precision Study" 또는 "결과" 텍스트
- 큰 X 아이콘 + "오답입니다" + 부제 "괜찮아요, 해설을 확인해보세요"
- "내가 선택한 답" 카드 (빨간 보더)
  - 선택지 라벨 + SQL 코드
- "정답" 카드 (초록 보더)
  - 선택지 라벨 + SQL 코드
- "학습 포인트" 카드
  - bullet 2~3개 (rationale 또는 AI diff-explain 결과)
- 하단 sticky [다음 문제 풀기] 버튼

### UI 요소 (정답 케이스)
- 큰 체크 아이콘 + "정답입니다!" + 부제
- "해설" 카드
  - 정답 SQL 코드 블록
  - 해설 본문 (rationale)
- [다음 문제 풀기] 버튼

### 필요 API
| Method | Path | 용도 |
|--------|------|------|
| (직전) POST | `/api/questions/{id}/submit` | 정/오답 + correctKey + rationale |
| POST | `/api/ai/diff-explain` | 학습 포인트 (오답일 때만, 옵션) |
| GET | `/api/ai/similar/{questionId}?k=3` | (옵션) 유사 문제 |

### 상호작용
1. 제출 결과는 navigate state 또는 query cache로 전달
2. 오답이면 [AI 해설 받기] 버튼 → diff-explain 호출 → "학습 포인트" 영역에 렌더링
3. [다음 문제 풀기] → 같은 토픽의 다음 문제 또는 목록으로 복귀

### 컷오프
- bottom sheet 변형 (디자인 8) — 풀스크린만
- 유사 문제 별도 화면 — 결과 화면 하단에 작은 리스트로 합치거나 컷
- "Daily Quest" 라벨

---

## 5. 통계 화면 (`/stats`) — P1

### UI 요소
- 헤더: "통계"
- 상단 카드 3개: 푼 문제, 정답률, 연속 학습
- 학습 추이 영역
  - "+12% vs last week" 같은 라벨 ❌ 컷
  - 막대 차트 7일치 (Recharts 또는 div 막대)
- 토픽별 숙련도 그리드
  - 토픽명 + 정답률 % (heatmap 색상 강도)
  - 빈 슬롯에 + 아이콘 ❌ 컷
- 최근 틀린 문제 리스트
  - Q번호 + 문제 지문 + N일 전
  - [더보기] 링크

### 필요 API
| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/progress?memberUuid=` | 상단 카드 3개 |
| GET | `/api/progress/heatmap?memberUuid=` | 토픽 그리드 |
| GET | `/api/progress/recent-wrong?memberUuid=&limit=4` | 최근 틀린 문제 |
| GET | `/api/progress/daily?memberUuid=&days=7` (옵션) | 학습 추이 차트 |

### 컷오프
- "+12% vs last week" 비교 표시
- 학습 추이 차트 자체 (Recharts 부담되면 div 막대로, 그것도 부담이면 컷)
- 빈 토픽 슬롯 추가 버튼
- 알림 벨 아이콘

---

## 6. 설정 화면 (`/settings`) — P1

### UI 요소
- 헤더: "설정"
- 부제: "학습 환경 및 계정 정보를 관리합니다"
- 카드 1개 (세 항목)
  - 디바이스 ID: UUID 표시 + 복사 버튼
  - 닉네임: 현재 닉네임 + 재생성 버튼 (↻)
  - 버전: 현재 버전 + "최신 버전" 뱃지
- 푸터: "passQL · Powered by ..." (옵션)

### 필요 API
| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/members/me?memberUuid=` | 닉네임 표시 |
| POST | `/api/members/me/regenerate-nickname` | 닉네임 재생성 |

### 컷오프
- "최신 버전" 체크 (실제 버전 비교 API 없음 — 그냥 뱃지만 표시)
- 알림 벨, ? 헬프 아이콘
- 다크모드 토글 (Phase 2)
- 학습 환경 관리 (실제 설정 항목 없음 — 부제만 표시)

---

## 디자인에서 컷오프된 항목 종합

| 항목 | 어디 | 컷 사유 |
|------|------|---------|
| 노트 탭 (4번째 탭) | 하단 탭바 | PRD에 없음, 5일 내 구현 불가 |
| 순위 탭 | 하단 탭바 | 인증 필요, 컷 |
| 내정보 탭 | 하단 탭바 | 설정 탭과 중복 |
| 알림 벨 아이콘 | 모든 화면 헤더 | 알림 시스템 없음 |
| ? 헬프 아이콘 | 일부 헤더 | 도움말 시스템 없음 |
| Pro Plan 뱃지 | 사이드바 (데스크탑) | 결제 모델 없음 |
| Daily Quest 라벨 | 홈 오늘의 문제 | 퀘스트 시스템 없음 |
| Precision Study 모드 | 결과 화면 헤더 | 학습 모드 분리 안 함 |
| Bottom sheet 결과 | 결과 화면 변형 | 풀스크린으로 통일 |
| "+12% vs last week" | 통계 학습 추이 | 주간 비교 집계 API 없음 |
| 빈 토픽 + 추가 버튼 | 통계 토픽 그리드 | 토픽은 admin에서만 추가 |
| 다크모드 | 설정 | Phase 2 |
| 사이드바 레이아웃 | 데스크탑 변형 | 모바일 우선 단일 레이아웃 |
| Schema Information 토글 | 문제 상세 | 항상 펼침으로 단순화 |

---

## API 엔드포인트 총 정리 (FE 관점)

| # | Method | Path | 사용 화면 | 우선순위 |
|---|--------|------|----------|---------|
| 1 | POST | `/api/members/register` | 첫 진입 | P0 |
| 2 | GET | `/api/members/me` | 홈, 설정 | P0 |
| 3 | POST | `/api/members/me/regenerate-nickname` | 설정 | P1 |
| 4 | GET | `/api/meta/topics` | 문제 목록 (필터) | P0 |
| 5 | GET | `/api/questions` | 문제 목록 | P0 |
| 6 | GET | `/api/questions/{id}` | 문제 상세 | P0 |
| 7 | POST | `/api/questions/{id}/execute` | 문제 상세 | P0 |
| 8 | POST | `/api/questions/{id}/submit` | 문제 상세 → 결과 | P0 |
| 9 | GET | `/api/questions/today` | 홈 | P0 |
| 10 | POST | `/api/ai/explain-error` | 문제 상세 (실행 에러) | P0 |
| 11 | POST | `/api/ai/diff-explain` | 결과 화면 (오답) | P0 |
| 12 | GET | `/api/ai/similar/{id}` | 결과 화면 (옵션) | P1 |
| 13 | GET | `/api/progress` | 홈, 통계 | P0 |
| 14 | GET | `/api/progress/heatmap` | 홈(취약영역), 통계 | P1 |
| 15 | GET | `/api/progress/recent-wrong` | 통계 | P1 |

**P0: 13개, P1: 2개** — 데모에 P0 13개만 동작하면 됨.

---

## 주요 구현 내용 (요약)

- 디자인에 노출된 화면 변형이 9장이지만, 데모용 SPA는 **5개 화면 + 1개 결과 풀스크린**으로 단일화
- 디자인에 흩어져 있던 4탭 구성 변형(홈/문제/통계/설정 vs 홈/문제/순위/내정보 vs 홈/문제/노트/설정)을 **홈/문제/통계/설정 4탭**으로 확정
- 결과 화면은 bottom sheet 변형을 버리고 **풀스크린 통일** — 구현 단순화 + 학습 강조
- 문제 상세의 선택지 SQL 실행은 사용자가 [실행] 버튼을 명시적으로 누르는 방식 (PRD 5.2 준수, 서버 부하 절감)
- AI 호출 지점은 두 곳: ① 선택지 실행 에러 시 [AI 물어보기], ② 제출 후 오답 시 [학습 포인트 받기]
- 통계/설정은 P1로 분류 — D5에 마무리, 시간 부족 시 학습 추이 차트와 닉네임 재생성은 컷

## 주의사항

- **오늘의 문제 / D-day는 백엔드에서 내려준다 (확정)**
  - `GET /api/questions/today` 응답에 `{ question, dDay }` 포함
  - 시험일은 `app_setting.exam.target_date`에서 백엔드가 계산 → 클라는 받기만 함
  - 사유: 프론트에서 비즈니스 로직 제거 원칙. 코드 프리즈 후 시험일/오늘의문제 변경이 admin에서 가능해야 함
- "정답률 N%" (문제 카드의 집계 정답률)는 백엔드 집계 부담이 있으므로 D5에 추가 또는 컷
- 선택지 자동 실행으로 인해 레이트리밋(`ratelimit.execute.per_minute = 60`) 빠르게 소진 가능 → 동일 선택지 재호출 방지 클라 캐시 + 어드민에서 한도 조정 가능
- 프론트에는 비즈니스 로직(날짜 계산, 정답 판정, 닉네임 생성 등) 일체 두지 않는다 — 백엔드 응답을 그대로 표시
