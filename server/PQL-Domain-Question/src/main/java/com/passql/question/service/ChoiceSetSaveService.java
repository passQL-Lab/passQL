package com.passql.question.service;

import com.passql.ai.dto.GeneratedChoiceDto;
import com.passql.ai.dto.GenerateChoiceSetResult;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.dto.ValidationReport;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * 선택지 세트·아이템 저장 전용 서비스.
 * <p>
 * ChoiceSetGenerationService 내부에서 self-invocation으로 @Transactional이 무시되는 문제를 방지하기 위해
 * 별도 빈으로 분리. Spring AOP 프록시를 통해 정상적으로 트랜잭션이 적용된다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChoiceSetSaveService {

    private final QuestionChoiceSetRepository choiceSetRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;

    /**
     * EXECUTABLE 선택지 세트 성공 저장 — 샌드박스 검증 결과(ValidationReport) 기반 is_correct 적용.
     */
    @Transactional
    public QuestionChoiceSet saveSuccess(
            Question question, ChoiceSetSource source, UUID memberUuid,
            PromptTemplate prompt, GenerateChoiceSetResult result,
            ValidationReport report, int attempts) {

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
                .sandboxValidationPassed(true)
                .isReusable(false)
                .totalElapsedMs(result.metadata() != null ? result.metadata().elapsedMs() : 0)
                .build();
        set = choiceSetRepository.saveAndFlush(set);

        List<GeneratedChoiceDto> choices = result.choices();
        for (int i = 0; i < choices.size(); i++) {
            GeneratedChoiceDto c = choices.get(i);
            // 샌드박스 결과 기반 is_correct 덮어쓰기
            boolean correct = report.items().get(i).matchesExpected();
            QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                    .choiceSetUuid(set.getChoiceSetUuid())
                    .choiceKey(c.key())
                    .sortOrder(i)
                    .kind(ChoiceKind.SQL)
                    .body(c.body())
                    .isCorrect(correct)
                    .rationale(c.rationale())
                    .build();
            choiceSetItemRepository.save(item);
        }

        log.info("[choice-gen] success: questionUuid={}, attempts={}, setUuid={}",
                question.getQuestionUuid(), attempts, set.getChoiceSetUuid());
        return set;
    }

    /**
     * CONCEPT_ONLY 선택지 세트 성공 저장 — AI의 is_correct 직접 사용 (샌드박스 없음).
     */
    @Transactional
    public QuestionChoiceSet saveConceptSuccess(
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
                .sandboxValidationPassed(false) // 개념 문제는 샌드박스 미사용
                .isReusable(false)
                .totalElapsedMs(result.metadata() != null ? result.metadata().elapsedMs() : 0)
                .build();
        set = choiceSetRepository.saveAndFlush(set);

        List<GeneratedChoiceDto> choices = result.choices();
        for (int i = 0; i < choices.size(); i++) {
            GeneratedChoiceDto c = choices.get(i);
            // AI가 직접 is_correct를 판별 — 샌드박스 검증 없음
            QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                    .choiceSetUuid(set.getChoiceSetUuid())
                    .choiceKey(c.key())
                    .sortOrder(i)
                    .kind(ChoiceKind.TEXT)
                    .body(c.body())
                    .isCorrect(c.isCorrect())
                    .rationale(c.rationale())
                    .build();
            choiceSetItemRepository.save(item);
        }

        log.info("[choice-gen-concept] success: questionUuid={}, attempts={}, setUuid={}",
                question.getQuestionUuid(), attempts, set.getChoiceSetUuid());
        return set;
    }

    /**
     * 선택지 세트 실패 저장.
     */
    @Transactional
    public void saveFailed(
            Question question, ChoiceSetSource source, UUID memberUuid,
            PromptTemplate prompt, GenerateChoiceSetResult result,
            int attempts, ErrorCode errorCode) {

        QuestionChoiceSet set = QuestionChoiceSet.builder()
                .questionUuid(question.getQuestionUuid())
                .source(source)
                .status(ChoiceSetStatus.FAILED)
                .generatedForMemberUuid(memberUuid)
                .promptTemplateUuid(prompt.getPromptTemplateUuid())
                .modelName(prompt.getModel())
                .temperature(prompt.getTemperature())
                .maxTokens(prompt.getMaxTokens())
                .generationAttempts(attempts)
                .sandboxValidationPassed(false)
                .isReusable(false)
                .build();
        choiceSetRepository.save(set);

        log.warn("[choice-gen] failed: questionUuid={}, attempts={}, errorCode={}",
                question.getQuestionUuid(), attempts, errorCode);
    }
}
