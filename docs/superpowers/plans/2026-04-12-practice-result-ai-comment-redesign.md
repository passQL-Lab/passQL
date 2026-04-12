# Practice Result AI Comment Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 퀴즈 결과 화면 AI 분석 섹션을 전면 개선 — 세션별 캐시, 프롬프트 DB 이관, UI 통합 애니메이션

**Architecture:** 백엔드는 `AiCommentService`에 `sessionUuid` 파라미터를 추가하고 캐시 키를 세션 단위로 변경하며 프롬프트를 `prompt_template` DB에서 조회하도록 변경. 프론트엔드는 Step2+3을 단일 화면으로 통합하고 AI 텍스트 단어 애니메이션 완료 후 문제 리스트가 순차 등장하도록 구현.

**Tech Stack:** Spring Boot (Java), Flyway, Redis, Gemini API, React 19, TypeScript, Tailwind CSS 4, useAiText hook

---

## File Map

### 백엔드
| 파일 | 역할 | 변경 |
|------|------|------|
| `PQL-Web/src/main/resources/db/migration/V0_0_100__add_ai_comment_prompt.sql` | ai_comment 프롬프트 DB 등록 | 신규 |
| `PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java` | 세션별 Submission 조회 쿼리 추가 | 수정 |
| `PQL-Application/src/main/java/com/passql/application/service/AiCommentService.java` | sessionUuid 파라미터, 세션 캐시, 프롬프트 DB 조회 | 수정 |
| `PQL-Web/src/main/java/com/passql/web/controller/ProgressController.java` | sessionUuid 파라미터 추가 | 수정 |
| `PQL-Web/src/main/java/com/passql/web/controller/ProgressControllerDocs.java` | getAiComment 스펙 문서 갱신 | 수정 |

### 프론트엔드
| 파일 | 역할 | 변경 |
|------|------|------|
| `client/src/api/progress.ts` | fetchAiComment 시그니처 변경 | 수정 |
| `client/src/pages/PracticeResult.tsx` | Step 통합, AI UI 개선, 애니메이션 | 수정 |

---

## Task 1: Flyway 마이그레이션 — ai_comment 프롬프트 등록

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_100__add_ai_comment_prompt.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- AI 코멘트 프롬프트 템플릿 등록 (v1)
-- 기존 AiCommentService 하드코딩 프롬프트를 DB 관리로 이관
-- 이번 세션 결과 + 누적 토픽 통계를 함께 활용하는 통합 피드백 프롬프트
INSERT INTO prompt_template (
    prompt_template_uuid,
    key_name,
    version,
    is_active,
    model,
    system_prompt,
    user_template,
    temperature,
    max_tokens,
    note
) VALUES (
    gen_random_uuid(),
    'ai_comment',
    1,
    true,
    'gemini-2.5-flash-lite',
    '당신은 SQL 시험 준비를 돕는 학습 코치입니다.
사용자의 이번 퀴즈 세션 결과와 전체 누적 토픽별 학습 현황을 함께 분석하여,
구체적이고 실질적인 한국어 피드백을 2~3문장으로 작성하세요.

규칙:
- 이번 세션에서 틀린 문제의 토픽을 구체적으로 언급할 것
- 누적 통계에서도 약한 토픽이면 "평소에도 약한 부분"임을 언급할 것
- 격려보다 정보 전달 위주로 작성할 것
- "~해보세요", "~추천합니다" 수준의 실질적 조언으로 마무리할 것
- "괜찮아요", "잘했어요" 같은 감탄사로 시작하지 말 것
- 백틱(`) 문자로 토픽명을 감싸서 강조할 것',
    '[이번 세션 결과]
{sessionStats}

[전체 누적 토픽별 정답률]
{topicStats}

위 데이터를 바탕으로 이번 세션과 전체 학습 현황을 함께 고려한 피드백을 작성해주세요.',
    0.7,
    400,
    'AI 코멘트: 세션 결과 + 누적 토픽 통계 통합 피드백 v1'
);
```

- [ ] **Step 2: 서버 기동하여 마이그레이션 적용 확인**

```bash
cd server
./gradlew :PQL-Web:bootRun
```

기동 로그에서 확인:
```
Flyway: Successfully applied 1 migration to schema "public" (execution time XXms)
```

- [ ] **Step 3: DB에서 데이터 확인**

관리자 UI `http://localhost:8080/admin/prompts` 접속 → `ai_comment` 키가 목록에 보이면 성공.

---

## Task 2: SubmissionRepository — 세션별 조회 쿼리 추가

**Files:**
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java`

- [ ] **Step 1: 세션별 Submission + 토픽명 조회 쿼리 추가**

파일 끝 `}` 앞에 아래 메서드를 추가한다.

```java
/**
 * 세션 내 제출 목록을 토픽명과 함께 조회 (AI 코멘트 세션 컨텍스트용).
 *
 * 네이티브 쿼리 사용 이유: Submission↔Question↔Topic 간 @ManyToOne 연관관계가 없어
 * JPQL theta-join 시 데카르트 조인 발생 우려.
 *
 * @return Object[] = { String topicDisplayName, Boolean isCorrect }
 */
@Query(value =
    "SELECT t.display_name AS topic_name, s.is_correct " +
    "FROM submission s " +
    "JOIN question q ON s.question_uuid = q.question_uuid " +
    "JOIN topic t ON q.topic_uuid = t.topic_uuid " +
    "WHERE s.session_uuid = CAST(:sessionUuid AS uuid) " +
    "ORDER BY s.submitted_at ASC",
    nativeQuery = true)
List<Object[]> findTopicResultsBySessionUuid(@Param("sessionUuid") String sessionUuid);
```

- [ ] **Step 2: 서버 컴파일 확인**

```bash
cd server
./gradlew :PQL-Domain-Submission:compileJava
```

Expected: `BUILD SUCCESSFUL`

---

## Task 3: AiCommentService — 세션 캐시 + 프롬프트 DB 조회

**Files:**
- Modify: `server/PQL-Application/src/main/java/com/passql/application/service/AiCommentService.java`

> 현재 파일 전체를 아래로 교체한다.

- [ ] **Step 1: AiCommentService 전체 교체**

```java
package com.passql.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.passql.ai.client.GeminiClient;
import com.passql.ai.dto.AiCommentResponse;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import com.passql.submission.dto.TopicAnalysisResponse;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.service.TopicAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiCommentService {

    private static final String CACHE_KEY_PREFIX = "ai-comment:";
    /** 세션 단위 캐시 TTL — 결과 화면 확인 시간으로 충분 */
    private static final long CACHE_TTL_HOURS = 2;

    private final GeminiClient geminiClient;
    private final TopicAnalysisService topicAnalysisService;
    private final SubmissionRepository submissionRepository;
    private final PromptService promptService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 세션별 AI 코멘트 반환.
     * 캐시 키: ai-comment:{memberUuid}:{sessionUuid} (TTL 2h)
     * 프롬프트: prompt_template DB의 'ai_comment' 활성 버전
     */
    public AiCommentResponse getAiComment(UUID memberUuid, UUID sessionUuid) {
        // 세션 단위 캐시 키 — 같은 세션 재진입 시 동일 텍스트 반환
        String cacheKey = CACHE_KEY_PREFIX + memberUuid + ":" + sessionUuid;

        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue((String) cached, AiCommentResponse.class);
            } catch (JsonProcessingException e) {
                log.warn("AI comment cache deserialization failed for {}, regenerating", memberUuid, e);
            }
        }

        // DB에서 활성 프롬프트 조회
        PromptTemplate prompt = promptService.getActivePrompt("ai_comment");

        // 이번 세션 결과 집계 (토픽명 + 정오답)
        String sessionStats = buildSessionStats(sessionUuid);

        // 누적 토픽 통계
        TopicAnalysisResponse analysis = topicAnalysisService.getTopicAnalysis(memberUuid);
        String topicStats;
        try {
            topicStats = objectMapper.writeValueAsString(analysis.topicStats());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize topic stats", e);
            return new AiCommentResponse("분석 데이터를 처리하는 중 오류가 발생했습니다.", LocalDateTime.now());
        }

        // userTemplate 변수 치환
        String userPrompt = prompt.getUserTemplate()
                .replace("{sessionStats}", sessionStats)
                .replace("{topicStats}", topicStats);

        // Gemini 호출
        String comment;
        try {
            comment = geminiClient.chat(
                    prompt.getModel(),
                    prompt.getSystemPrompt(),
                    userPrompt,
                    prompt.getTemperature(),
                    prompt.getMaxTokens()
            );
        } catch (Exception e) {
            log.error("Gemini AI comment generation failed for member={}, session={}", memberUuid, sessionUuid, e);
            throw new CustomException(ErrorCode.AI_UNAVAILABLE);
        }

        AiCommentResponse response = new AiCommentResponse(comment.trim(), LocalDateTime.now());

        // 세션 단위 캐시 저장 (TTL 2h)
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache AI comment for member={}, session={}", memberUuid, sessionUuid, e);
        }

        return response;
    }

    /** 세션 내 제출 목록을 "토픽명: 정답/오답" 형태 텍스트로 변환 */
    private String buildSessionStats(UUID sessionUuid) {
        List<Object[]> rows = submissionRepository.findTopicResultsBySessionUuid(sessionUuid.toString());
        if (rows.isEmpty()) {
            return "세션 데이터 없음";
        }
        return rows.stream()
                .map(row -> {
                    String topicName = (String) row[0];
                    Boolean isCorrect = (Boolean) row[1];
                    return topicName + ": " + (Boolean.TRUE.equals(isCorrect) ? "정답" : "오답");
                })
                .collect(Collectors.joining("\n"));
    }

    @Transactional
    public void evictCache(UUID memberUuid) {
        // 기존 멤버 단위 캐시 키는 자연 만료 대기 (세션 단위로 전환됨)
        redisTemplate.delete(CACHE_KEY_PREFIX + memberUuid);
    }
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
cd server
./gradlew :PQL-Application:compileJava
```

Expected: `BUILD SUCCESSFUL`

---

## Task 4: ProgressController + Docs — sessionUuid 파라미터 추가

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/ProgressController.java`
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/ProgressControllerDocs.java`

- [ ] **Step 1: ProgressController의 getAiComment 수정**

`ProgressController.java`의 `getAiComment` 메서드를 아래로 교체:

```java
@GetMapping("/ai-comment")
public ResponseEntity<AiCommentResponse> getAiComment(
    @RequestParam UUID memberUuid,
    @RequestParam UUID sessionUuid
) {
    return ResponseEntity.ok(aiCommentService.getAiComment(memberUuid, sessionUuid));
}
```

- [ ] **Step 2: ProgressControllerDocs의 getAiComment 수정**

`ProgressControllerDocs.java`의 `getAiComment` 메서드 시그니처와 `@ApiLogs`, `@Operation`을 아래로 교체:

```java
@ApiLogs({
    @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 71, description = "AI 영역 분석 코멘트 API 추가 (Redis 캐시 24h TTL, Submission 저장 시 evict)"),
    @ApiLog(date = "2026.04.12", author = Author.SUHSAECHAN, issueNumber = 176, description = "sessionUuid 파라미터 추가. 캐시 키 세션 단위 변경(ai-comment:{memberUuid}:{sessionUuid}, TTL 2h). 프롬프트 DB 이관(ai_comment 키). 이번 세션 결과 + 누적 통계 통합 피드백."),
})
@Operation(
    summary = "AI 영역 분석 코멘트 조회",
    description = """
        ## 인증(JWT): **불필요** (추후 헤더 전환 예정)

        ## 요청 파라미터
        - memberUuid (UUID, required): 회원 식별자
        - sessionUuid (UUID, required): 퀴즈 세션 식별자

        ## 반환값 (AiCommentResponse)
        - comment: AI 생성 한국어 코멘트 (2~3문장, 이번 세션 + 누적 통계 통합 피드백)
        - generatedAt: 코멘트 생성(캐시 저장) 시각

        ## 캐싱
        - Redis key: ai-comment:{memberUuid}:{sessionUuid}, TTL 2시간
        - 같은 세션 재진입 시 동일 텍스트 반환 (불필요한 AI 호출 방지)
        - 새 세션 풀면 새 AI 호출
        """
)
ResponseEntity<AiCommentResponse> getAiComment(
    @RequestParam UUID memberUuid,
    @RequestParam UUID sessionUuid
);
```

- [ ] **Step 3: 전체 빌드 확인**

```bash
cd server
./gradlew :PQL-Web:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
cd server
git add PQL-Web/src/main/resources/db/migration/V0_0_100__add_ai_comment_prompt.sql \
        PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java \
        PQL-Application/src/main/java/com/passql/application/service/AiCommentService.java \
        PQL-Web/src/main/java/com/passql/web/controller/ProgressController.java \
        PQL-Web/src/main/java/com/passql/web/controller/ProgressControllerDocs.java
git commit -m "feat: AI 코멘트 세션 단위 캐시 + 프롬프트 DB 이관 + 세션 결과 통합 피드백 #176"
```

---

## Task 5: 프론트엔드 — fetchAiComment API 시그니처 변경

**Files:**
- Modify: `client/src/api/progress.ts`

- [ ] **Step 1: fetchAiComment 함수 수정**

`client/src/api/progress.ts`의 `fetchAiComment` 함수를 아래로 교체:

```typescript
// AI 영역 분석 코멘트 (세션 단위 Redis 캐시 2h — 세션별 새 피드백 생성)
export function fetchAiComment(sessionUuid: string): Promise<AiCommentResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/ai-comment?memberUuid=${uuid}&sessionUuid=${sessionUuid}`);
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd client
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: 에러 없음 (또는 PracticeResult.tsx에서 fetchAiComment 인자 누락 에러만 — Task 6에서 수정 예정)

---

## Task 6: 프론트엔드 — PracticeResult.tsx Step 통합 + UI + 애니메이션

**Files:**
- Modify: `client/src/pages/PracticeResult.tsx`

> 현재 파일 전체를 아래로 교체한다.

- [ ] **Step 1: PracticeResult.tsx 전체 교체**

```typescript
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, RotateCcw, Target, Clock, Timer, Sparkles } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { fetchAiComment } from "../api/progress";
import { useAiText } from "../hooks/useAiText";
import ScoreCountUp from "../components/ScoreCountUp";
import StepNavigator from "../components/StepNavigator";

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0초";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}초`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return remSec > 0 ? `${min}분 ${remSec}초` : `${min}분`;
}

/** useAiText 단어 수 기반 총 애니메이션 시간 계산 (훅과 동일 상수) */
function calcAiAnimDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  // startDelay 200ms + 단어 간격 55ms + 마지막 fade 300ms + 여유 300ms
  return 200 + (wordCount - 1) * 55 + 300 + 300;
}

export default function PracticeResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = usePracticeStore();

  // 다시 풀기 후 복귀 시 step2로 바로 진입 (기존 step3 → 통합 후 step2)
  const initialStepRef = useRef(store.returnStep != null ? Math.min(store.returnStep, 1) : 0);
  const initialStep = initialStepRef.current;

  const [visibleStats, setVisibleStats] = useState<boolean[]>([false, false, false]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 문제 카드 순차 등장 상태 — 인덱스별 visible 여부
  const [visibleCards, setVisibleCards] = useState<boolean[]>([]);
  // 문제 리스트 섹션 자체 등장 여부
  const [resultVisible, setResultVisible] = useState(false);

  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    store.clearReturnStep();
    return () => { timerIdsRef.current.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI 코멘트: sessionId 단위 캐시 — 세션마다 새 피드백
  const { data: aiCommentData, isLoading: aiCommentLoading } = useQuery({
    queryKey: ["aiComment", sessionId],
    queryFn: () => fetchAiComment(sessionId!),
    staleTime: 1000 * 60 * 60 * 2, // 2시간 — 백엔드 Redis TTL과 맞춤
    enabled: !!sessionId,
  });
  const aiComment = aiCommentLoading ? null : (aiCommentData?.comment ?? "");

  // AI 텍스트 단어 fade-in 훅
  const aiTextRef = useAiText(aiComment ?? undefined, { startDelay: 200 });

  // AI 애니메이션 완료 후 문제 카드 순차 등장
  useEffect(() => {
    if (!aiComment) return;
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current = [];

    const animDuration = calcAiAnimDuration(aiComment);
    const cardCount = store.results.length;

    // 문제 리스트 섹션 먼저 등장
    const sectionId = setTimeout(() => {
      setResultVisible(true);
      setVisibleCards(new Array(cardCount).fill(false));
    }, animDuration);
    timerIdsRef.current.push(sectionId);

    // 카드 80ms 간격 순차 등장
    store.results.forEach((_, i) => {
      const id = setTimeout(() => {
        setVisibleCards((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, animDuration + 100 + i * 80);
      timerIdsRef.current.push(id);
    });
  }, [aiComment, store.results]);

  const analysis = useMemo(() => {
    const results = store.results;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = results.length;
    const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);
    return { correctCount, totalCount, totalDurationMs };
  }, [store.results]);

  if (!store.sessionId || store.sessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  const totalDuration = formatDuration(analysis.totalDurationMs);
  const avgDuration =
    analysis.totalCount > 0
      ? formatDuration(Math.round(analysis.totalDurationMs / analysis.totalCount))
      : "0초";

  const handleScoreComplete = useCallback(() => {
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current = [];
    [0, 1, 2].forEach((i) => {
      const id = setTimeout(() => {
        setVisibleStats((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 150);
      timerIdsRef.current.push(id);
    });
  }, []);

  const step1 = (
    <>
      <span className="inline-block bg-accent-light text-brand text-sm font-medium px-3.5 py-1 rounded-full mb-8">
        {store.topicName}
      </span>
      <ScoreCountUp
        target={analysis.correctCount}
        total={analysis.totalCount}
        onComplete={handleScoreComplete}
      />
      <div className="flex gap-8 mt-8">
        <div className={`text-center transition-all duration-300 ease-out ${visibleStats[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="text-lg font-bold">
            {analysis.totalCount > 0 ? Math.round((analysis.correctCount / analysis.totalCount) * 100) : 0}%
          </div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Target size={11} className="text-text-caption" />정답률
          </div>
        </div>
        <div className={`text-center transition-all duration-300 ease-out ${visibleStats[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="text-lg font-bold">{totalDuration}</div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Clock size={11} className="text-text-caption" />총 시간
          </div>
        </div>
        <div className={`text-center transition-all duration-300 ease-out ${visibleStats[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="text-lg font-bold">{avgDuration}</div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Timer size={11} className="text-text-caption" />문제당 평균
          </div>
        </div>
      </div>
    </>
  );

  // Step2: AI 분석 + 문제별 결과 통합
  // greeting 제거, 카드 테두리/배경 제거, AI 뱃지만 유지
  const step2 = (
    <div className="text-left w-full max-w-90 px-2 sm:px-0">
      {/* AI 뱃지 */}
      <div className="flex justify-center mb-5">
        <span className="inline-flex items-center gap-1.5 bg-accent-light text-brand text-xs font-semibold px-3 py-1 rounded-full">
          <Sparkles size={13} />
          AI 분석
        </span>
      </div>

      {/* AI 텍스트 — 카드 없이 바로, 단어별 fade-in */}
      {aiComment === null ? (
        <div className="space-y-2 animate-pulse mb-6">
          <div className="h-4 bg-border rounded w-full" />
          <div className="h-4 bg-border rounded w-5/6" />
          <div className="h-4 bg-border rounded w-4/6" />
        </div>
      ) : aiComment ? (
        <p ref={aiTextRef} className="text-body leading-relaxed mb-6" />
      ) : null}

      {/* 문제별 결과 — AI 애니메이션 완료 후 등장 */}
      <div
        className={`transition-all duration-400 ease-out ${
          resultVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {resultVisible && (
          <>
            <div className="w-full h-px bg-border mb-3" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text-caption">문제별 결과</p>
              <p className="text-xs text-text-caption">눌러서 내 답 확인</p>
            </div>
            <div className="flex flex-col gap-2">
              {store.results.map((r, i) => {
                const q = store.questions.find((q) => q.questionUuid === r.questionUuid);
                const isOpen = openIndex === i;
                return (
                  <div
                    key={r.questionUuid}
                    className={`bg-surface-card border rounded-[10px] overflow-hidden transition-all duration-350 ease-out ${
                      r.isCorrect ? "border-border" : "border-red-300"
                    } ${visibleCards[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-3 text-left"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                    >
                      <span className={`text-sm font-bold w-5 text-center shrink-0 ${r.isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{q?.stemPreview}</p>
                        <p className="text-xs text-text-caption mt-0.5">{formatDuration(r.durationMs)}</p>
                      </div>
                      {r.isCorrect ? (
                        <Check size={16} className="text-green-500 shrink-0" />
                      ) : (
                        <span className="text-xs font-medium text-red-400 shrink-0">오답</span>
                      )}
                    </button>
                    <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 pt-2 border-t border-border space-y-2">
                          <p className="text-sm text-text-secondary leading-relaxed">{q?.stemPreview}</p>
                          <p className={`text-xs font-medium ${r.isCorrect ? "text-green-600" : "text-red-500"}`}>
                            내 답: {r.selectedChoiceBody}
                          </p>
                          <Link
                            to={`/recommendation/${r.questionUuid}`}
                            state={{ returnPath: `/practice/${sessionId}`, initialStep: 1 }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand bg-accent-light rounded-md px-3 py-1.5"
                          >
                            <RotateCcw size={12} /> 다시 풀기
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen max-w-120 mx-auto px-4 sm:px-0">
      <StepNavigator
        key={initialStep}
        steps={[step1, step2]}
        initialStep={initialStep}
        lastButtonLabel="카테고리 목록으로"
        onLastStep={() => {
          store.reset();
          navigate("/questions", { replace: true });
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크 및 빌드**

```bash
cd client
npm run build 2>&1 | grep -E "error TS|Error" | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 개발 서버 기동 후 브라우저 확인**

```bash
cd client
npm run dev
```

`http://localhost:5174/practice/session-{임의sessionId}/result` 접속하여 확인:
1. Step1(점수/통계) 정상 작동
2. "다음" 클릭 → Step2 진입
3. AI 뱃지 pill 등장
4. AI 텍스트 단어별 fade-in 진행
5. 텍스트 완료 후 구분선 + "문제별 결과" 헤더 등장
6. 문제 카드 80ms 간격 순차 등장
7. "카테고리 목록으로" 버튼 작동

- [ ] **Step 4: 다시 풀기 후 복귀 동작 확인**

문제 카드 "다시 풀기" 클릭 → 문제 풀기 → 결과 화면 복귀 시 Step2(AI+문제 목록)로 바로 진입되는지 확인.

- [ ] **Step 5: 커밋**

```bash
cd client
git add src/api/progress.ts src/pages/PracticeResult.tsx
git commit -m "feat: 결과 화면 AI 분석 + 문제별 결과 통합, 단어 애니메이션 완료 후 카드 순차 등장 #176"
```

---

## 자기 검토 (Self-Review)

### 스펙 커버리지
- [x] AI 텍스트 동일 반복 문제 → 세션 단위 캐시 키로 해결 (Task 3)
- [x] 이번 세션 결과 미반영 → `buildSessionStats()` + 프롬프트 변수 치환 (Task 3)
- [x] 프롬프트 하드코딩 → `prompt_template` DB + Flyway 마이그레이션 (Task 1, 3)
- [x] `border-l-4` 카드 제거 → step2 UI 교체 (Task 6)
- [x] greeting 문구 제거 → step2에서 greeting 완전 제거 (Task 6)
- [x] Step2+3 통합 → steps 배열 2개로 축소 (Task 6)
- [x] 단어 애니메이션 완료 후 문제 리스트 등장 → `calcAiAnimDuration` + useEffect (Task 6)
- [x] `returnStep` 처리 → `Math.min(store.returnStep, 1)`로 step2 이상 클램핑 (Task 6)

### 타입 일관성
- `fetchAiComment(sessionUuid: string)` → Task 5에서 정의, Task 6에서 `sessionId!` 전달 — 일치
- `aiTextRef` = `useAiText<HTMLParagraphElement>` 반환값 → `<p ref={aiTextRef}>` — 일치
- `visibleCards[i]` 인덱스 — `store.results.map((_, i)` 와 동일 인덱스 — 일치

### 누락 체크
- `ProgressControllerDocs` 업데이트 → Task 4에 포함
- Flyway 버전 `V0_0_100` — `version.yml` 현재 버전 `0.0.100`과 일치
