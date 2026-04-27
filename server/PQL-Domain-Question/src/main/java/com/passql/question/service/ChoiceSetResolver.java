package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.ChoiceGenerationMode;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.repository.QuestionChoiceSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * 정책에 따라 사용자에게 제공할 선택지 세트를 resolve 한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChoiceSetResolver {

    private final QuestionService questionService;
    private final QuestionChoiceSetRepository choiceSetRepository;
    private final ChoiceSetGenerationService choiceSetGenerationService;
    private final MemberRepository memberRepository;

    public QuestionChoiceSet resolveForUser(UUID questionUuid, UUID memberUuid) {
        Question question = questionService.getQuestionEntity(questionUuid);
        ChoiceGenerationMode mode = getMemberMode(memberUuid);

        if (question.getExecutionMode() == ExecutionMode.CONCEPT_ONLY) {
            return resolveConcept(questionUuid, memberUuid, mode);
        }

        switch (question.getChoiceSetPolicy()) {
            case AI_ONLY:
                return resolveAiOnly(questionUuid, memberUuid, mode);
            case ODD_ONE_OUT:
                return resolveAiOnly(questionUuid, memberUuid, mode);
            case RESULT_MATCH:
                return resolveResultMatch(questionUuid, memberUuid, mode);
            case CURATED_ONLY:
                throw new CustomException(ErrorCode.CHOICE_SET_POLICY_NOT_IMPLEMENTED,
                        "CURATED_ONLY 정책은 아직 지원되지 않습니다.");
            case HYBRID:
                throw new CustomException(ErrorCode.CHOICE_SET_POLICY_NOT_IMPLEMENTED,
                        "HYBRID 정책은 아직 지원되지 않습니다.");
            default:
                throw new CustomException(ErrorCode.CHOICE_SET_POLICY_NOT_IMPLEMENTED,
                        "알 수 없는 정책: " + question.getChoiceSetPolicy());
        }
    }

    /** 멤버의 선택지 생성 모드 조회. 멤버 미존재 시 PRACTICE 폴백. */
    private ChoiceGenerationMode getMemberMode(UUID memberUuid) {
        return memberRepository.findById(memberUuid)
                .map(Member::getChoiceGenerationMode)
                .orElse(ChoiceGenerationMode.PRACTICE);
    }

    private QuestionChoiceSet resolveConcept(UUID questionUuid, UUID memberUuid, ChoiceGenerationMode mode) {
        if (mode == ChoiceGenerationMode.REAL) {
            log.info("[resolver] concept REAL mode, runtime generation: questionUuid={}", questionUuid);
            return choiceSetGenerationService.generateConcept(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
        }

        // 연습 모드: 1순위 본인 프리페치 → 2순위 전체 OK → 미스 시 생성
        Optional<QuestionChoiceSet> prefetched = choiceSetRepository
                .findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
                        questionUuid, memberUuid, ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
        if (prefetched.isPresent()) {
            markConsumed(prefetched.get());
            log.info("[resolver] concept prefetch HIT: questionUuid={}", questionUuid);
            return prefetched.get();
        }

        Optional<QuestionChoiceSet> reusable = choiceSetRepository
                .findFirstByQuestionUuidAndStatusOrderByCreatedAtDesc(questionUuid, ChoiceSetStatus.OK);
        if (reusable.isPresent()) {
            log.info("[resolver] concept PRACTICE reuse HIT: questionUuid={}", questionUuid);
            return reusable.get();
        }

        log.info("[resolver] concept MISS, runtime generation: questionUuid={}", questionUuid);
        return choiceSetGenerationService.generateConcept(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
    }

    private QuestionChoiceSet resolveAiOnly(UUID questionUuid, UUID memberUuid, ChoiceGenerationMode mode) {
        if (mode == ChoiceGenerationMode.REAL) {
            log.info("[resolver] REAL mode, runtime generation: questionUuid={}", questionUuid);
            return choiceSetGenerationService.generate(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
        }

        // 연습 모드: 1순위 본인 프리페치 → 2순위 전체 OK → 미스 시 생성
        Optional<QuestionChoiceSet> prefetched = choiceSetRepository
                .findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
                        questionUuid, memberUuid, ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
        if (prefetched.isPresent()) {
            markConsumed(prefetched.get());
            log.info("[resolver] prefetch HIT: questionUuid={}", questionUuid);
            return prefetched.get();
        }

        Optional<QuestionChoiceSet> reusable = choiceSetRepository
                .findFirstByQuestionUuidAndStatusOrderByCreatedAtDesc(questionUuid, ChoiceSetStatus.OK);
        if (reusable.isPresent()) {
            log.info("[resolver] PRACTICE reuse HIT: questionUuid={}", questionUuid);
            return reusable.get();
        }

        log.info("[resolver] MISS, runtime generation: questionUuid={}, memberUuid={}", questionUuid, memberUuid);
        return choiceSetGenerationService.generate(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
    }

    private QuestionChoiceSet resolveResultMatch(UUID questionUuid, UUID memberUuid, ChoiceGenerationMode mode) {
        if (mode == ChoiceGenerationMode.REAL) {
            log.info("[resolver] result-match REAL mode, runtime generation: questionUuid={}", questionUuid);
            return choiceSetGenerationService.generateResultMatch(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
        }

        // 연습 모드: 1순위 본인 프리페치 → 2순위 전체 OK → 미스 시 생성
        Optional<QuestionChoiceSet> prefetched = choiceSetRepository
                .findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
                        questionUuid, memberUuid, ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
        if (prefetched.isPresent()) {
            markConsumed(prefetched.get());
            log.info("[resolver] result-match prefetch HIT: questionUuid={}", questionUuid);
            return prefetched.get();
        }

        Optional<QuestionChoiceSet> reusable = choiceSetRepository
                .findFirstByQuestionUuidAndStatusOrderByCreatedAtDesc(questionUuid, ChoiceSetStatus.OK);
        if (reusable.isPresent()) {
            log.info("[resolver] result-match PRACTICE reuse HIT: questionUuid={}", questionUuid);
            return reusable.get();
        }

        log.info("[resolver] result-match MISS, runtime generation: questionUuid={}", questionUuid);
        return choiceSetGenerationService.generateResultMatch(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
    }

    /**
     * 프리페치 캐시 소비 마킹 — 짧은 트랜잭션으로 처리.
     */
    @Transactional
    protected void markConsumed(QuestionChoiceSet set) {
        set.setConsumedAt(LocalDateTime.now());
        choiceSetRepository.save(set);
    }
}
