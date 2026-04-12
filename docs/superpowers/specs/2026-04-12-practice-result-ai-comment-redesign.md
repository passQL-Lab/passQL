# 결과 화면 AI 분석 전면 개선 스펙

**날짜**: 2026-04-12  
**관련 이슈**: 결과 화면 Step2+3 통합, AI 코멘트 UI/프롬프트/캐시 개선

---

## 1. 배경 및 목표

### 현재 문제
1. **AI 텍스트 동일 반복**: 캐시 키가 `ai-comment:{memberUuid}` 고정이라 퀴즈를 새로 풀어도 동일한 텍스트가 반환됨
2. **이번 세션 결과 미반영**: 프롬프트에 누적 토픽 통계만 전달 — 방금 푼 세션 결과가 없음
3. **프롬프트 하드코딩**: `AiCommentService`만 유일하게 `prompt_template` DB를 사용하지 않음 (다른 AI 기능은 전부 DB 관리)
4. **UI 문제**: `border-l-4` 왼쪽 줄 카드 스타일, greeting 문구("다시 도전해봐요!" 등), Step2·3 분리 구조

### 목표
- AI 코멘트가 **이번 세션 + 누적 통계 통합** 피드백을 제공
- 캐시를 **세션 단위**로 변경해 매 세션 새 피드백 생성
- 프롬프트를 **`prompt_template` DB**로 이관 (Flyway 마이그레이션)
- 결과 화면 Step2·3을 **단일 화면**으로 통합, 자연스러운 애니메이션 구현

---

## 2. 백엔드 변경

### 2-1. API 파라미터 추가

**엔드포인트**: `GET /api/progress/ai-comment`

| 파라미터 | 타입 | 필수 | 변경 |
|---------|------|------|------|
| `memberUuid` | UUID | O | 기존 유지 |
| `sessionUuid` | UUID | O | **신규 추가** |

### 2-2. 캐시 키 변경

```
기존: ai-comment:{memberUuid}           TTL 24h
변경: ai-comment:{memberUuid}:{sessionUuid}  TTL 2h
```

- 같은 세션 재진입 시 동일 텍스트 반환 (불필요한 AI 호출 방지)
- 새 세션 풀면 자연스럽게 새 AI 호출
- TTL 2h — 세션 결과 확인 시간으로 충분

### 2-3. 프롬프트 DB 이관

**새 키**: `ai_comment` (v1)

Flyway 마이그레이션 파일 추가:  
`V0_0_XX__add_ai_comment_prompt.sql`

```sql
INSERT INTO prompt_template (
  prompt_template_uuid, key_name, version, is_active, model,
  system_prompt, user_template, temperature, max_tokens, note
) VALUES (
  gen_random_uuid(),
  'ai_comment', 1, true,
  'gemini-2.5-flash-lite',
  -- system_prompt: 아래 참조
  -- user_template: 아래 참조
  0.7, 400,
  'AI 코멘트: 세션 결과 + 누적 토픽 통계 통합 피드백 v1'
);
```

**system_prompt**:
```
당신은 SQL 시험 준비를 돕는 학습 코치입니다.
사용자의 이번 퀴즈 세션 결과와 전체 누적 토픽별 학습 현황을 함께 분석하여,
구체적이고 실질적인 한국어 피드백을 2~3문장으로 작성하세요.

규칙:
- 이번 세션에서 틀린 문제의 토픽을 구체적으로 언급할 것
- 누적 통계에서도 약한 토픽이면 "평소에도 약한 부분"임을 언급할 것
- 격려보다 정보 전달 위주로 작성할 것
- "~해보세요", "~추천합니다" 수준의 실질적 조언으로 마무리할 것
- 절대 "괜찮아요", "잘했어요" 같은 감탄사로 시작하지 말 것
```

**user_template** (변수: `{sessionStats}`, `{topicStats}`):
```
[이번 세션 결과]
{sessionStats}

[전체 누적 토픽별 정답률]
{topicStats}

위 데이터를 바탕으로 이번 세션과 전체 학습 현황을 함께 고려한 피드백을 작성해주세요.
```

### 2-4. AiCommentService 변경

```java
// 변경 전
public AiCommentResponse getAiComment(UUID memberUuid)

// 변경 후
public AiCommentResponse getAiComment(UUID memberUuid, UUID sessionUuid)
```

- 캐시 키: `ai-comment:{memberUuid}:{sessionUuid}`
- 프롬프트: `promptService.getActivePrompt("ai_comment")` 로 DB 조회
- userTemplate의 `{sessionStats}` 치환: `sessionUuid`로 해당 세션의 Submission 목록 조회
- userTemplate의 `{topicStats}` 치환: 기존 `TopicAnalysisService` 활용

**sessionStats 형태** (이번 세션 Submission에서 집계):
```json
[
  { "topicName": "JOIN", "correct": false, "durationSec": 32 },
  { "topicName": "그룹함수/집계", "correct": true, "durationSec": 18 },
  ...
]
```

### 2-5. ProgressController 변경

```java
@GetMapping("/ai-comment")
public ResponseEntity<AiCommentResponse> getAiComment(
    @RequestParam UUID memberUuid,
    @RequestParam UUID sessionUuid   // 신규
) {
    return ResponseEntity.ok(aiCommentService.getAiComment(memberUuid, sessionUuid));
}
```

---

## 3. 프론트엔드 변경

### 3-1. Step 구조 변경

```
기존: Step1(점수/통계) → Step2(AI 분석) → Step3(문제별 결과)
변경: Step1(점수/통계) → Step2(AI 분석 + 문제별 결과 통합)
```

`StepNavigator`의 steps 배열을 3개 → 2개로 축소.

### 3-2. AI 분석 UI 변경

**제거**:
- `border-l-4 border-brand` 왼쪽 줄 카드
- greeting 문구 ("괜찮아요!", "다시 도전해봐요!" 등)
- 카드 배경/테두리

**유지**:
- AI 뱃지 pill (`<Sparkles> AI 분석`, 인디고)

**변경 후 구조**:
```tsx
<div className="text-left w-full">
  {/* AI 뱃지 — 중앙 정렬 */}
  <div className="flex justify-center mb-4">
    <span className="inline-flex items-center gap-1.5 bg-accent-light text-brand text-xs font-semibold px-3 py-1 rounded-full">
      <Sparkles size={13} />
      AI 분석
    </span>
  </div>

  {/* AI 텍스트 — 카드 없이 바로 */}
  {aiComment === null ? (
    <스켈레톤 />
  ) : (
    <p ref={aiTextRef} className="text-body leading-relaxed" />
    // useAiText 훅으로 단어별 fade-in
  )}

  {/* 문제별 결과 — AI 애니메이션 완료 후 순차 등장 */}
  <div ref={resultRef} className="mt-6 opacity-0 translate-y-3 transition-all duration-400">
    {/* 문제 카드 리스트 */}
  </div>
</div>
```

### 3-3. 애니메이션 시퀀스

```
1. Step2 진입
2. AI 뱃지 등장 (즉시)
3. useAiText 단어별 fade-in 시작 (200ms delay, 55ms/단어)
4. 마지막 단어 완료 + 300ms 여유
5. 문제별 결과 섹션 fade+slideUp (opacity 0→1, translateY 12px→0, 400ms)
6. 문제 카드 순차 등장 (80ms 간격)
7. 마지막 카드 등장 후 스크롤 하단 유도
```

**구현**: `useAiText`의 단어 수로 총 소요 시간 계산:
```ts
const totalMs = 200 + (wordCount - 1) * 55 + 300 + AFTER_GAP;
setTimeout(() => showResults(), totalMs);
```

### 3-4. API 호출 변경

```ts
// 기존
queryKey: ["aiComment"]
queryFn: fetchAiComment  // memberUuid만

// 변경
queryKey: ["aiComment", sessionId]
queryFn: () => fetchAiComment(sessionId)  // memberUuid + sessionUuid
```

`fetchAiComment` 함수 시그니처 변경:
```ts
export function fetchAiComment(sessionUuid: string): Promise<AiCommentResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/ai-comment?memberUuid=${uuid}&sessionUuid=${sessionUuid}`);
}
```

---

## 4. 변경 파일 목록

### 백엔드
| 파일 | 변경 유형 |
|------|---------|
| `db/migration/V0_0_XX__add_ai_comment_prompt.sql` | 신규 |
| `AiCommentService.java` | 수정 (파라미터, 캐시 키, 프롬프트 DB 이관) |
| `ProgressController.java` | 수정 (sessionUuid 파라미터 추가) |

### 프론트엔드
| 파일 | 변경 유형 |
|------|---------|
| `src/api/progress.ts` | 수정 (fetchAiComment 시그니처) |
| `src/pages/PracticeResult.tsx` | 수정 (Step 통합, UI, 애니메이션) |

---

## 5. 비변경 사항

- `StepNavigator` 컴포넌트 내부 — steps 수만 변경
- `useAiText` 훅 — 변경 없음
- `TopicAnalysisService` — 변경 없음
- `PromptService`, `PromptTemplate` 엔티티 — 변경 없음
- `GeminiClient` — 변경 없음
- 기존 캐시 키(`ai-comment:{memberUuid}`) — 자연 만료 대기 (강제 삭제 불필요)
