# AnswerFeedback 결과 화면 UI 전면 개선 스펙

**작성일**: 2026-04-13  
**이슈**: #055  
**대상 파일**: `client/src/pages/AnswerFeedback.tsx`, `client/src/pages/QuestionDetail.tsx`, `client/src/styles/components.css`

---

## 1. 개요

홈화면의 AI 추천문제 및 오늘의 문제에서 진입하는 단일 문제 결과 화면(`AnswerFeedback`)을 개선한다.

핵심 목표:
- 문제를 풀고 나서 어떤 문제였는지 다시 확인할 수 있도록 문제 지문 토글 추가
- EXECUTABLE 모드에서 모든 선택지가 펼쳐지는 정보 과부하 해소 — 아코디언 구조로 전환
- 실제 SQL 실행·비교가 가능하다는 점을 자연스럽게 어필 (모두 실행 + 개별 실행 버튼)
- Dead code 제거 및 기존 헤더 디자인 확정 반영

---

## 2. 데이터 요구사항

### FeedbackState 인터페이스 변경

`QuestionDetail.tsx`에서 navigate state로 전달하는 `FeedbackState`에 두 필드를 추가한다.

```typescript
interface FeedbackState {
  // 기존 필드 유지
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql: string | null;
  readonly correctSql: string | null;
  readonly questionUuid: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult: ExecuteResult | null;
  readonly correctResult: ExecuteResult | null;
  readonly isDailyChallenge?: boolean;
  readonly choices?: readonly ChoiceItem[];
  // 신규 추가
  readonly stem?: string;
  readonly topicName?: string;
}
```

### QuestionDetail.tsx navigate state 변경

`fullResult` 객체에 `stem`과 `topicName`을 추가한다. `question.stem`과 `question.topicName`은 이미 QuestionDetail에서 사용 중이므로 백엔드 변경 불필요.

---

## 3. UI 구조

### 공통 구조 (EXECUTABLE / CONCEPT_ONLY 공통)

```
[헤더] ← 확정된 B 스타일 (3px 컬러 바 + 도트 eyebrow + 제목 + 부제목)
  ↓
[문제 보기 토글 카드] ← 신규 추가
  ↓
[해설 카드]
  ↓
[SQL 실행 비교 섹션] ← EXECUTABLE만 표시
  ↓
[유사 문제] (기존 유지)
  ↓
[하단 CTA 버튼] (항상 인디고)
```

### 3-1. 헤더 (확정)

- 상단 3px 컬러 바: 정답 `#22C55E`, 오답 `#EF4444`, 좌→우 scaleX 슬라이드인 애니메이션
- 도트 + eyebrow 텍스트 ("정답" / "오답")
- 큰 제목: "맞혔어요!" / "틀렸어요"
- 부제목: "잘 맞혔어요. 다음 문제도 도전해보세요" / "해설을 확인하고 다시 도전해보세요"
- 헤더 배경 항상 흰색, 하단 border

### 3-2. 문제 보기 토글 카드 (신규)

- 항상 표시 (EXECUTABLE / CONCEPT_ONLY 공통), 기본 상태: 접힘
- 헤더 행: lucide `BookOpen` 아이콘 + "문제 보기" 레이블 + stem 첫 줄 미리보기 + `ChevronDown`
- 펼쳤을 때: 토픽 뱃지 (`badge-topic` 기존 클래스) + 문제 지문 텍스트
- stem이 없으면 카드 자체를 렌더링하지 않음

### 3-3. 해설 카드

변경 없음. `card-base` 클래스, "해설" 마이크로 레이블 + 본문.

### 3-4. SQL 실행 비교 섹션 (EXECUTABLE 전용) — 아코디언 구조

**섹션 헤더 행**
- 좌: "SQL 실행 비교" 마이크로 레이블
- 우: "모두 실행" 버튼 — 미실행 선택지 전체 일괄 실행, 인디고 계열 아웃라인 버튼

**선택지 카드 (아코디언)**

| 상태 | 기본 | 배경/보더 | 뱃지 |
|------|------|----------|------|
| 내 선택 (오답) | 펼침 | `ans-card-wrong` | "내 선택" (빨강) |
| 정답 | 펼침 | `ans-card-correct` | "정답" (초록) |
| 내 선택 = 정답 | 펼침 | `ans-card-correct` | "내 선택 · 정답" (초록) |
| 나머지 (실행됨) | 접힘 | 기본 흰색 | 없음 |
| 나머지 (미실행) | 접힘 | 기본 흰색 | 없음 |

- **A/B/C/D 키 레이블 제거** — 정답/내 선택 뱃지만으로 구분
- 접힌 카드 헤더: SQL 한 줄 미리보기 + 행수 pill (실행된 경우) + ChevronDown
- 펼친 카드 바디: SQL 코드 블록 + 실행 결과 테이블 (실행된 경우) OR 개별 "실행" 버튼 (미실행)

**실행 버튼 동작**
- "모두 실행": `sqlChoices` 중 캐시 없는 항목 전체 `executeChoice()` 병렬 호출
- "실행" (개별): 해당 선택지만 `executeChoice()` 호출, 기존 로딩/에러 상태 관리 동일

### 3-5. 하단 CTA 버튼

변경 없음. 항상 `btn-primary` (인디고).

---

## 4. 제거 항목 (Dead code)

- `diffExplain` import 제거
- `useMutation` / `diffMutation` 관련 코드 제거
- `aiSheetOpen`, `aiText` state 제거
- `AiExplanationSheet` 컴포넌트 및 import 제거

---

## 5. CSS / 스타일 규칙

- `style={{ }}` 인라인 금지
- 기존 `ans-card-wrong`, `ans-card-correct`, `ans-card-neutral` 클래스 재사용
- 새 클래스는 `client/src/styles/components.css`에 추가
- 아코디언 토글은 React state (`Set<string>` openKeys)로 관리
- 애니메이션: 기존 `feedback-card-anim-*` 클래스 재사용

---

## 6. 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| `stem`이 없음 | 문제 보기 카드 렌더링 안 함 |
| CONCEPT_ONLY | SQL 섹션 없음, 문제 보기 + 해설 + 선택지 답 카드만 |
| 정답 (EXECUTABLE) | "내 선택 · 정답" 카드 1개만 펼침, 나머지 접힘 |
| 미실행 선택지 | 접힌 상태에서 개별 "실행" 버튼 제공 |
| 실행 에러 | 기존 `error-card` 스타일 유지, "재시도" 버튼 |
| `choices`가 없음 | SQL 섹션 렌더링 안 함 |
