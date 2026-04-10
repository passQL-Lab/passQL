# Chapter Flow Design

**Date:** 2026-04-11  
**Feature:** 문제 탭 챕터 플로우 (Duolingo-style 순차 문제 풀기)

---

## 목표

문제 탭에서 토픽을 선택하면 10개 문제를 순서대로 풀 수 있는 챕터 플로우로 전환.  
리스트 나열 방식(`QuestionListPage`) 대신 한 문제씩 집중해서 풀고,  
AppBar에 진행률(1/10)과 프로그레스 바를 표시.

---

## 아키텍처

### 라우트 흐름

```
TopicListPage (/questions)
  └─ 토픽 카드 탭
       └─ context.push('/questions/chapter?topic=CODE&topicName=NAME')
            └─ ChapterPage (풀스크린, parentNavigatorKey: _rootKey)
                 ├─ GET /questions?topic=CODE&size=10 → questionUuids 로드
                 ├─ 문제 순서 표시
                 └─ 마지막 문제 제출 후
                      └─ context.go('/practice/chapter-{uuid}/result', extra: ChapterSummary)
                           └─ PracticeResultPage (기존 재사용)
```

### 기존 코드 재사용

| 재사용 대상 | 용도 |
|---|---|
| `questionDetailProvider(uuid)` | 문제 상세 로드 |
| `questionInteractionProvider(uuid)` | SSE + 선택 + 실행 + 제출 상태 |
| `_HeaderSection`, `_StemSection`, `SchemaSection`, `_ChoicesSection`, `ExecuteResultCard` | 문제 UI 위젯 |
| `PracticeResultPage` | 챕터 완료 3단계 결과 화면 |

### 삭제

- `lib/presentation/pages/questions/question_list_page.dart` — 더 이상 사용 안 함
- `lib/presentation/widgets/question/question_list_card.dart` — 더 이상 사용 안 함
- `lib/router/app_router.dart`의 `/questions/list` 서브 라우트 제거

---

## 상태 관리

### ChapterState

```dart
class ChapterState {
  final List<String> questionUuids;     // API에서 로드된 UUID 목록 (size=10)
  final int currentIndex;               // 현재 문제 인덱스 (0-based)
  final List<ChapterResult> results;    // 제출 완료된 결과 누적
  final bool isLoadingList;             // 초기 목록 로드 중 여부
  final SubmitResult? lastSubmitResult; // 현재 문제 제출 결과 (인라인 피드백용)
  final bool isAnswered;                // 현재 문제 제출 완료 여부
}
```

### ChapterResult

```dart
class ChapterResult {
  final String questionUuid;
  final bool isCorrect;
  final int durationMs;  // 문제 진입~제출 소요시간
}

class ChapterSummary {
  final String topicName;
  final List<ChapterResult> results;
  final int totalDurationMs;
}
```

### ChapterNotifier 책임

- `loadQuestions(topicCode)`: GET /questions → questionUuids 세팅
- `onSubmitted(SubmitResult, durationMs)`: results에 ChapterResult 추가, lastSubmitResult 세팅
- `nextQuestion()`: currentIndex++, lastSubmitResult 초기화
- `isLastQuestion`: currentIndex == questionUuids.length - 1

### per-question 인터랙션

기존 `questionInteractionProvider(uuid)` family 그대로 사용.  
`currentIndex` 변경 시 이전 uuid의 provider는 autoDispose로 자동 해제.

---

## UI 명세

### AppBar

```
[홈 아이콘]        1 / 10        [SELECT 기본]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← LinearProgressIndicator
```

- 홈 아이콘: `context.go('/home')` 이동
- 중앙: `${currentIndex + 1} / ${questionUuids.length}`
- 우측: topicName pill 뱃지 (AppColors.accentLight + AppColors.brandIndigo 텍스트)
- 프로그레스 바: `value = currentIndex / total` (제출 완료 시 `(currentIndex + 1) / total`)

### Body

기존 QuestionDetailPage 위젯 임베드 (스크롤 가능):

1. `_HeaderSection` — 난이도 별 + 실행모드 뱃지
2. `SchemaSection` — EXECUTABLE일 때 DDL (접을 수 있음)
3. `_StemSection` — 문제 지문
4. `_ChoicesSection` — SSE 로딩 / 선택지 / SSE 에러
5. `ExecuteResultCard` — SQL 실행 결과 (EXECUTABLE + 선택 후)

### Bottom Bar 상태 전환

| 상태 | 표시 내용 |
|---|---|
| 선택 전 | `답안 제출하기` 버튼 (비활성, 회색) |
| 선택 후 미제출 | `답안 제출하기` 버튼 (활성, 인디고) |
| 제출 완료 (N < 마지막) | `ChapterFeedbackBar` + `다음 문제` 버튼 |
| 제출 완료 (마지막) | `ChapterFeedbackBar` + `결과 보기` 버튼 |

### ChapterFeedbackBar (제출 후 인라인 피드백)

별도 ResultPage로 이동하지 않고, Bottom Bar 위에 표시:

```
┌──────────────────────────────────┐
│  정답입니다!  (초록 배경)         │   ← isCorrect=true
│  오답이에요. 정답: B  (빨간 배경) │   ← isCorrect=false
│  [AI에게 자세히 물어보기]          │   ← 오답 OR CONCEPT_ONLY 정답 시 표시
└──────────────────────────────────┘
[          다음 문제 / 결과 보기         ]
```

**AI 해설 버튼 표시 조건** (기존 버그 수정 포함):
- 오답: 항상 표시 (EXECUTABLE, CONCEPT_ONLY 무관)
- 정답 + CONCEPT_ONLY: 표시 (현재 웹에서 누락된 케이스)
- 정답 + EXECUTABLE: 표시하지 않음

AI 해설: 기존 `AiExplainSheet` 재사용, `isErrorExplain: false` (diff-explain 엔드포인트).

---

## 챕터 완료 → PracticeResultPage

마지막 문제 제출 후 `결과 보기` 탭:

```dart
context.go(
  '/practice/chapter-${uuid}/result',
  extra: ChapterSummary(
    topicName: topicName,
    results: chapterState.results,
    totalDurationMs: totalDurationMs,
  ),
);
```

`PracticeResultPage`는 extra를 `ChapterSummary`로 캐스팅하여 기존 3단계 결과 표시.  
`/practice/:sessionId/result` 라우트를 재사용하고, sessionId는 `chapter-{randomUuid}` 형식으로 전달.  
sessionId는 라우트 파라미터 요건 충족용이며 PracticeResultPage 내부에서 사용하지 않음.

---

## 파일 구조

### 신규 파일

| 파일 | 역할 |
|---|---|
| `lib/presentation/pages/questions/chapter_page.dart` | 챕터 플로우 메인 페이지 |
| `lib/presentation/providers/chapter_providers.dart` | ChapterState + ChapterNotifier + ChapterResult |
| `lib/presentation/widgets/chapter/chapter_app_bar.dart` | 진행률 AppBar + 프로그레스 바 |
| `lib/presentation/widgets/chapter/chapter_feedback_bar.dart` | 제출 후 인라인 피드백 + AI 해설 버튼 |

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `lib/router/app_routes.dart` | `questionChapter` 상수 추가, `questionList` 제거 |
| `lib/router/app_router.dart` | `/questions/chapter` 풀스크린 라우트 추가, `/questions/list` 제거 |
| `lib/presentation/pages/questions/topic_list_page.dart` | 탭 링크를 `/questions/chapter`로 변경 |
| `lib/presentation/pages/result/result_page.dart` | AI 해설 버튼 조건 수정 (CONCEPT_ONLY 정답도 표시) |

### 삭제 파일

| 파일 | 이유 |
|---|---|
| `lib/presentation/pages/questions/question_list_page.dart` | ChapterPage로 대체 |
| `lib/presentation/widgets/question/question_list_card.dart` | 더 이상 사용 안 함 |

---

## 버그 수정 (이번 작업에 포함)

| 버그 | 수정 내용 |
|---|---|
| AI 해설 버튼이 EXECUTABLE 오답에만 표시 | CONCEPT_ONLY 정답 + 오답 모든 케이스에 표시 |

---

## 미포함 범위

- 문제 사전 로드(prefetch) 최적화 — 현재 문제 제출 후 다음 문제 lazy 로드로 충분
- 챕터 중간 이탈 확인 다이얼로그 — 홈 아이콘 탭 시 별도 확인 없이 바로 이동
- 오프라인 지원 — 네트워크 필요
