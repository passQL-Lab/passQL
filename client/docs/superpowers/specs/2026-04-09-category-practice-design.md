# 카테고리 기반 AI 문제 생성 & 세트 풀이 디자인

## 개요

기존 문제 목록 페이지(`/questions`)의 필터 기반 UI를 카테고리 카드 선택 방식으로 전환한다. 카드를 클릭하면 AI가 해당 카테고리의 문제 10개를 생성하고, 사용자는 순차적으로 풀이한다. 완료 후 3스텝 결과 요약 화면을 보여준다.

## 화면 흐름

```
카테고리 카드 목록 → 로딩 오버레이 → 세트 풀이 (1/10 ~ 10/10) → 결과 요약 (3스텝)
```

## 1. 카테고리 카드 목록

### 데이터 소스
- 기존 `GET /meta/topics` API에서 TopicTree[] 로드
- 백엔드 API 변경 시 유연하게 대응 (카드는 동적 렌더링)

### UI
- 반응형 그리드: 모바일 2열, 데스크톱(1024px+) 3열
- 카드: `#FFFFFF` 배경, `1px solid #E5E7EB` 보더, 12px radius, 20px 패딩
- 카드 내부: lucide-react 아이콘(44x44 `#EEF2FF` 배경, 10px radius) + 카테고리명(16px/700) + 짧은 설명(12px/`#9CA3AF`)
- hover: `border-color: #4F46E5`
- 하단 안내 문구: "카테고리를 선택하면 AI가 맞춤 문제 10개를 생성합니다"

### 카테고리별 아이콘 매핑
- 백엔드에서 아이콘 코드를 내려주지 않으므로, 프론트에서 topic.code → lucide 아이콘 매핑 테이블 관리
- 매핑 없는 카테고리는 기본 아이콘(`file-question`) 사용

## 2. 로딩 오버레이

### 트리거
- 카테고리 카드 클릭 시 오버레이 표시
- 백엔드에 문제 생성 요청 (API 미확정, mock으로 대체)

### UI
- 카드 목록 위에 `rgba(17,24,39,0.5)` 오버레이
- 중앙 흰색 카드: 16px radius, 40px/32px 패딩
- 스피너: 48x48, `#EEF2FF` 테두리 + `#4F46E5` 상단
- 선택된 카테고리명 pill: `#EEF2FF` 배경, `#4F46E5` 텍스트
- 마이크로카피: 3초마다 랜덤 전환

### 마이크로카피 (유머/가벼운 톤)
- "AI가 머리를 굴리는 중..."
- "SQL 요정이 문제를 짓는 중..."
- "데이터베이스 세계에서 퀴즈를 가져오는 중..."
- "SELECT 난이도 FROM 적당한곳..."
- "뇌세포를 자극할 문제를 고르는 중..."
- "{카테고리} 마스터로 가는 길을 닦는 중..."
- 카테고리명을 동적으로 삽입하는 문구 포함

### 완료 시
- 첫 번째 문제가 준비되면 오버레이 닫고 세트 풀이 화면으로 전환

## 3. 세트 풀이 플로우

### 구조
- 세트 래퍼 컴포넌트가 기존 QuestionDetail을 감싸는 구조
- QuestionDetail 자체는 수정하지 않음
- 상단에 진행률 바 표시: "1/10", "2/10", ...

### 상태 관리 (Zustand store 또는 로컬 state)
- `sessionId`: 세트 식별자
- `topicCode`: 선택한 카테고리
- `questions`: 문제 UUID 배열 (최대 10개, 점진적으로 채워짐)
- `currentIndex`: 현재 풀고 있는 문제 인덱스
- `results`: 문제별 결과 배열 `{ questionUuid, isCorrect, selectedChoiceKey, startedAt, completedAt }`

### 문제 풀이 흐름
1. 문제 표시 (기존 QuestionDetail 재활용)
2. 제출 → 결과를 로컬 state에 기록 (소요 시간 포함)
3. 자동으로 다음 문제로 이동
4. 10문제 완료 → 결과를 백엔드에 한 번에 전송 → 결과 요약 화면

### 타이머
- 문제 진입 시 `startedAt = Date.now()` 기록
- 제출 시 `completedAt = Date.now()` 기록
- 소요 시간 = completedAt - startedAt

## 4. 결과 요약 화면 (3스텝)

### 스텝 네비게이션
- 상단 바: 뒤로가기 버튼(40x40, 흰 배경+보더, 항상 표시) + 중앙 "1 / 3" 카운터
- 하단: "다음" 풀 너비 버튼
- 콘텐츠와 버튼 사이에 dot indicator (3개)
- 스와이프 + 버튼 모두 지원

### 스텝 1: 점수
- 카테고리 pill
- 점수 카운트업 애니메이션: 0부터 최종 점수까지
  - 이징: 처음 빠르고 점점 느려짐 (60ms + step * 30ms)
  - 각 단계마다 바운스 이펙트 (scale 1 → 1.3 → 0.95 → 1)
  - 색상 전환: 0~3 빨강(`#EF4444`), 4~6 주황(`#F59E0B`), 7~8 인디고(`#4F46E5`), 9~10 초록(`#22C55E`)
- 카운트 완료 후 fade-in: "정답" 라벨 + 통계(정답률, 총 시간, 평균 시간)

### 스텝 2: AI 분석
- 대화체 인사 ("꽤 잘했어요!", "완벽해요!" 등 — 점수에 따라 동적)
- 자연스러운 한 문단: 잘한 부분(초록 강조) + 약한 부분(빨강 강조)
- Tip 박스: `#F3F4F6` 배경, 8px radius

### 스텝 3: 문제별 결과
- 각 문제가 개별 카드 (`#FFFFFF`, `1px solid #E5E7EB`, 10px radius)
- 오답 카드: `border-color: #FCA5A5`
- 번호: 숫자만 (컨테이너 없음), 정답 초록 / 오답 빨강
- 정답: lucide `check` 아이콘
- 오답: "다시" 버튼 (`#EEF2FF` 배경, `rotate-ccw` 아이콘) → 클릭 시 해당 문제의 `/questions/:uuid`로 이동 (단독 풀이 모드)
- 소요 시간 표시

### 마지막 스텝 버튼
- "다른 카테고리" → 카테고리 카드 목록으로 복귀

## 5. 라우팅

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/questions` | CategoryCards | 카테고리 카드 목록 (기존 Questions 교체) |
| `/practice/:sessionId/:index` | PracticeSet | 세트 풀이 래퍼 |
| `/practice/:sessionId/result` | PracticeResult | 3스텝 결과 요약 |

## 6. API (mock 우선)

### 문제 생성 (백엔드 미확정)
- mock: 카테고리 선택 시 2초 딜레이 후 기존 mock 문제 10개 반환
- 실제 API 확정 시 교체

### 결과 제출 (백엔드 미확정)
- mock: 결과 배열을 받아 AI 분석 텍스트 반환
- 요청 body (예상):
  ```json
  {
    "topicCode": "JOIN",
    "results": [
      { "questionUuid": "...", "isCorrect": true, "selectedChoiceKey": "A", "durationMs": 18000 }
    ]
  }
  ```
- 응답 (예상):
  ```json
  {
    "correctCount": 7,
    "totalCount": 10,
    "totalDurationMs": 272000,
    "greeting": "꽤 잘했어요!",
    "analysis": "INNER JOIN과 테이블 별칭은 이미 익숙하게...",
    "tip": "LEFT JOIN + WHERE col IS NULL 패턴을 연습해보세요."
  }
  ```

## 7. 난이도 필터
- 제거. 카테고리 선택만으로 문제 생성.

## 8. 통계 페이지 3D 시각화
- 별도 스코프. 이번 디자인 범위 밖. 추후 Three.js로 구현 예정.
