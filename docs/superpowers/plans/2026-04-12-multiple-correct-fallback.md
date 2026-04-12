# MULTIPLE_CORRECT Fallback 저장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI_ONLY 정책 선택지 생성 시 3회 재시도 후에도 `MULTIPLE_CORRECT`로 실패할 경우, AI의 `isCorrect` 마킹이 정확히 1개면 그것을 신뢰해 저장하고 사용자에게 선택지를 보여준다.

**Architecture:** `ChoiceSetSaveService`에 `saveWithAiCorrect()` 메서드를 추가해 샌드박스 검증 없이 AI 판단 기반으로 저장한다. `ChoiceSetGenerationService.generate()`의 최종 실패 분기에서 `lastErrorCode == MULTIPLE_CORRECT && AI isCorrect 1개` 조건을 만족하면 throw 대신 이 메서드를 호출해 반환한다.

**Tech Stack:** Java 21, Spring Boot, JPA (Hibernate), PostgreSQL

---

## 파일 변경 목록

| 파일 | 변경 유형 | 역할 |
|------|-----------|------|
| `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetSaveService.java` | **수정** | `saveWithAiCorrect()` 메서드 추가 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java` | **수정** | 최종 실패 분기에 AI fallback 로직 추가 |

---

### Task 1: `ChoiceSetSaveService`에 `saveWithAiCorrect()` 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetSaveService.java`

- [ ] **Step 1: `saveWithAiCorrect()` 메서드 추가**

`saveFailed()` 메서드 바로 위에 아래 메서드를 추가한다.

```java
/**
 * MULTIPLE_CORRECT fallback 저장 — 샌드박스 검증 실패 시 AI isCorrect 기반으로 저장.
 * sandboxValidationPassed=false로 기록해 데이터 품질 추적 가능하게 한다.
 * CONCEPT_ONLY의 saveConceptSuccess()와 동일한 신뢰 전략 — AI isCorrect 직접 사용.
 */
@Transactional
public QuestionChoiceSet saveWithAiCorrect(
        Question question, ChoiceSetSource source, UUID memberUuid,
        PromptTemplate prompt, GenerateChoiceSetResult result, int attempts) {

    QuestionChoiceSet set = QuestionChoiceSet.builder()
            .questionUuid(question.getQuestionUuid())
            .source(source)
            .status(ChoiceSetStatus.OK)
            .generatedForMemberUuid(memberUuid)
            .promptTemplateUuid(prompt.getPromptTemplateUuid())
            .modelName(prompt.getModel())
            .temperature(prompt.getTemperature())
            .maxTokens(prompt.getMaxTokens())
            .generationAttempts(attempts)
            .sandboxValidationPassed(false) // 샌드박스 MULTIPLE_CORRECT 실패 후 AI 판단 fallback
            .isReusable(false)
            .totalElapsedMs(result.metadata() != null ? result.metadata().elapsedMs() : 0)
            .build();
    set = choiceSetRepository.saveAndFlush(set);

    List<GeneratedChoiceDto> choices = result.choices();
    for (int i = 0; i < choices.size(); i++) {
        GeneratedChoiceDto c = choices.get(i);
        QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                .choiceSetUuid(set.getChoiceSetUuid())
                .choiceKey(c.key())
                .sortOrder(i)
                .kind(ChoiceKind.SQL)
                .body(c.body())
                .isCorrect(c.isCorrect()) // AI 판단 직접 사용
                .rationale(c.rationale())
                .build();
        choiceSetItemRepository.save(item);
    }

    log.info("[choice-gen] ai-fallback success: questionUuid={}, attempts={}, setUuid={}",
            question.getQuestionUuid(), attempts, set.getChoiceSetUuid());
    return set;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/server
./gradlew :PQL-Domain-Question:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetSaveService.java
git commit -m "feat: ChoiceSetSaveService에 AI isCorrect fallback 저장 메서드 추가"
```

---

### Task 2: `ChoiceSetGenerationService.generate()`에 fallback 분기 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java:189-195`

- [ ] **Step 1: 최종 실패 분기를 다음으로 교체**

현재 코드 (`generate()` 메서드 맨 끝, `// 3회 다 실패` 주석 이후):

```java
// 3회 다 실패
log.error("[choice-gen] 최대 재시도 초과: questionUuid={}, lastErrorCode={}", questionUuid, lastErrorCode);
choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, MAX_ATTEMPTS, lastErrorCode);
throw new CustomException(
        lastErrorCode != null ? lastErrorCode : ErrorCode.CHOICE_SET_GENERATION_FAILED,
        "questionUuid=" + questionUuid + ", source=" + source);
```

교체 후:

```java
// 3회 다 실패 — MULTIPLE_CORRECT이고 AI isCorrect=true가 정확히 1개면 AI 판단 신뢰 후 반환
log.error("[choice-gen] 최대 재시도 초과: questionUuid={}, lastErrorCode={}", questionUuid, lastErrorCode);
if (lastErrorCode == ErrorCode.CHOICE_SET_VALIDATION_MULTIPLE_CORRECT && lastResult != null) {
    long aiCorrectCount = lastResult.choices().stream()
            .filter(GeneratedChoiceDto::isCorrect)
            .count();
    if (aiCorrectCount == 1) {
        log.warn("[choice-gen] MULTIPLE_CORRECT fallback: AI isCorrect=1개 신뢰, sandboxValidationPassed=false 저장. questionUuid={}", questionUuid);
        return choiceSetSaveService.saveWithAiCorrect(
                question, source, memberUuid, prompt, lastResult, MAX_ATTEMPTS);
    }
    log.error("[choice-gen] MULTIPLE_CORRECT fallback 불가: aiCorrectCount={}. questionUuid={}", aiCorrectCount, questionUuid);
}
choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, MAX_ATTEMPTS, lastErrorCode);
throw new CustomException(
        lastErrorCode != null ? lastErrorCode : ErrorCode.CHOICE_SET_GENERATION_FAILED,
        "questionUuid=" + questionUuid + ", source=" + source);
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/server
./gradlew :PQL-Domain-Question:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 전체 서버 빌드 확인**

```bash
./gradlew :PQL-Web:bootJar
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java
git commit -m "feat: MULTIPLE_CORRECT 3회 실패 시 AI isCorrect=1개면 fallback 저장으로 선택지 표시 #XXX"
```

---

## 검증 방법

1. `choiceSetPolicy=AI_ONLY`이고 SQL 동치 유형인 문제 (`60aceda5-2876-4317-98fd-965efa4aac6e`) 재시도
2. 백엔드 로그에서 확인:
   ```
   [choice-gen] MULTIPLE_CORRECT fallback: AI isCorrect=1개 신뢰, sandboxValidationPassed=false 저장
   [choice-gen] ai-fallback success: questionUuid=..., attempts=3, setUuid=...
   ```
3. 프론트에서 선택지 4개가 정상 표시되는지 확인
4. DB에서 `sandbox_validation_passed=false`로 저장됐는지 확인:
   ```sql
   SELECT choice_set_uuid, sandbox_validation_passed, status
   FROM question_choice_set
   WHERE question_uuid = '60aceda5-2876-4317-98fd-965efa4aac6e'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
