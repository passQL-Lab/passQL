package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
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

    /**
     * questionUuid + memberUuid 로 사용자에게 제공할 선택지 세트를 결정한다.
     *
     * @return 사용 가능한 QuestionChoiceSet
     */
    @Transactional
    public QuestionChoiceSet resolveForUser(UUID questionUuid, UUID memberUuid) {
        Question question = questionService.getQuestionEntity(questionUuid);

        switch (question.getChoiceSetPolicy()) {
            case AI_ONLY:
                return resolveAiOnly(questionUuid, memberUuid);
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

    private QuestionChoiceSet resolveAiOnly(UUID questionUuid, UUID memberUuid) {
        // 1. 프리페치 캐시 조회
        Optional<QuestionChoiceSet> prefetched = choiceSetRepository
                .findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
                        questionUuid, memberUuid,
                        ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);

        if (prefetched.isPresent()) {
            // 2. HIT: consumed_at 마킹 후 반환
            QuestionChoiceSet set = prefetched.get();
            set.setConsumedAt(LocalDateTime.now());
            choiceSetRepository.save(set);
            log.info("[resolver] prefetch HIT: questionUuid={}, setUuid={}",
                    questionUuid, set.getChoiceSetUuid());
            return set;
        }

        // 3. MISS: 실시간 생성
        log.info("[resolver] prefetch MISS, runtime generation: questionUuid={}, memberUuid={}",
                questionUuid, memberUuid);
        return choiceSetGenerationService.generate(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
    }
}
