# Practice Result UI 전면 개선 스펙

## 배경

현재 결과 화면(PracticeResult + StepNavigator)은 다음 문제들을 갖고 있다:

- StepNavigator 헤더가 매 스텝마다 다른 아이콘(홈/뒤로)을 보여줘 시각적 불일치
- `1/3` 텍스트와 하단 인디케이터 점이 중복
- "다음 >" 버튼의 ChevronRight 아이콘 불필요
- "다른 카테고리 ⊞" 텍스트/아이콘이 맥락에 맞지 않음
- 통계 레이블 "평균"이 무엇의 평균인지 불명확
- 1번 스텝 통계 수치가 카운트업 완료와 동시에 한꺼번에 표시됨 (애니메이션 없음)
- AI 리뷰가 단순 텍스트 덩어리 — AI 프로젝트 브랜딩 부재
- 문제별 결과 클릭 시 문제 preview 없음

## 변경 범위

- `client/src/components/StepNavigator.tsx` — 전면 재설계
- `client/src/pages/PracticeResult.tsx` — 3개 스텝 모두 개선

---

## 1. StepNavigator 재설계

### 헤더 제거
- 기존 상단 바(홈 버튼, `N/total` 텍스트, 빈 오른쪽 공간) 완전 제거
- 뒤로가기/홈 네비게이션 없음 — 결과 화면은 단방향 흐름이고 홈은 하단 탭바로 접근 가능

### 인디케이터 상단 이동
- 기존 하단에 있던 점 인디케이터(•••)를 **상단**으로 이동
- 화면 진입 즉시 전체 단계 수 파악 가능
- 현재 스텝: 인디고(`bg-brand`) 넓은 pill, 나머지: 회색(`bg-border`) 작은 원

### 하단 버튼 텍스트 정리
- 중간 스텝: **"다음"** (ChevronRight 아이콘 제거)
- 마지막 스텝: **"카테고리 목록으로"** (Grid2x2 아이콘 제거)

### 레이아웃 구조
```
┌─────────────────────────────┐
│  • — •  •   (상단 인디케이터) │  ← 상단 고정, 16px 상하 padding
│                             │
│   [스텝 콘텐츠 영역]          │  ← flex-1, 스와이프 가능
│                             │
│  [다음 / 카테고리 목록으로]    │  ← 하단 고정 버튼
└─────────────────────────────┘
```

---

## 2. PracticeResult 스텝별 개선

### 스텝 1 — 점수 화면

**레이아웃 (기존 유지)**
```
      계층 쿼리 / PIVOT        ← 토픽 뱃지 (인디고 pill)

         0  / 1               ← ScoreCountUp 카운트업
           정답

  🎯 정답률   🕐 총 시간   ⏱ 문제당 평균    ← 레이블 행
     0%         4초           4초           ← 수치 행
```

**순차 등장 애니메이션 (staggered)**
- ScoreCountUp `onComplete` 콜백 발생 후 시작
- 정답률 → 총 시간 → 문제당 평균 순서로 150ms 간격으로 순차 등장
- 각 항목: 아래에서 위로 12px 이동 + fade in, `duration-300 ease-out`
- Tailwind `transition-all` + `opacity` + `translate-y` 조합으로 구현 (인라인 style 금지)

**아이콘**
- 레이블 텍스트 앞에 lucide-react 아이콘, `text-text-caption` 회색
- 정답률: `Target` 아이콘
- 총 시간: `Clock` 아이콘
- 문제당 평균: `Timer` 아이콘

**텍스트 변경**
- `평균` → `문제당 평균`

---

### 스텝 2 — AI 리뷰

**AI 브랜딩 추가**
- 상단에 `Sparkles` 아이콘 + "AI 분석" 인디고 pill 뱃지
- 뱃지: `bg-accent-light text-brand` pill 스타일

**코멘트 카드**
- 인디고 왼쪽 4px border 카드로 감싸기
- `border-l-4 border-brand bg-accent-light/30 rounded-xl px-4 py-3`
- 로딩 스켈레톤은 카드 내부에 표시

**레이아웃**
```
  ✦ AI 분석   (인디고 pill 뱃지)

  다시 도전해봐요!   (greeting 텍스트)

  ┌──────────────────────────────┐
  ▌ 데이터 모델링, SELECT 기본... │  ← 인디고 border 카드
  └──────────────────────────────┘
```

---

### 스텝 3 — 문제별 결과

**아코디언 확장 (클릭 시 preview)**
- 문제 카드 클릭 → 아래로 300ms ease-out 펼치기
- `grid grid-rows-[0fr]` → `grid grid-rows-[1fr]` 전환으로 자연스러운 높이 애니메이션
- 펼쳐지면 표시할 내용:
  - `stemPreview` 전체 텍스트 (truncate 제거)
  - 내가 선택한 답 키 표시 (예: "선택: B")
  - 정답 여부 (정답이면 초록, 오답이면 빨강 텍스트)
- 한 번에 하나만 열림 (다른 카드 클릭 시 이전 카드 닫힘)
- 오답 카드: `border-red-300` 유지, 정답 카드: `border-border`

**"다시" 버튼 위치**
- 아코디언 열렸을 때 하단에 표시 (기존 카드 우측에서 이동)

---

## 3. 변경하지 않는 것

- ScoreCountUp 컴포넌트 — 기존 카운트업 애니메이션 그대로 유지
- `fetchAiComment` API 연동 로직 — 변경 없음
- `onLastStep` 동작 — store.reset() + `/questions` 이동 그대로
- 스와이프 제스처 — 그대로 유지
- 전체 색상 시스템, 타이포그래피 — Design.md 준수

---

## 구현 파일

| 파일 | 변경 내용 |
|------|-----------|
| `client/src/components/StepNavigator.tsx` | 전면 재작성 |
| `client/src/pages/PracticeResult.tsx` | 3개 스텝 개선 |
