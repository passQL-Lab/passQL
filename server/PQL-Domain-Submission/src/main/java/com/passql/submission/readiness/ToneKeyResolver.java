package com.passql.submission.readiness;

import org.springframework.stereotype.Component;

/**
 * D-day와 시도 이력을 바탕으로 카피 톤 키를 결정한다.
 *
 * 카피 문자열 자체는 FE가 관리하고, 백엔드는 "어떤 톤인지"만 키로 내려준다.
 * 규칙은 우선순위 순으로 처음 매칭되는 것을 반환한다.
 *
 * 1. daysUntilExam == null         → NO_EXAM
 * 2. recentAttemptCount == 0       → ONBOARDING
 * 3. daysUntilExam <  0            → POST_EXAM
 * 4. daysUntilExam == 0            → TODAY
 * 5. 1  <= daysUntilExam <  7      → SPRINT
 * 6. 7  <= daysUntilExam < 15      → PUSH
 * 7. 15 <= daysUntilExam <= 30     → STEADY
 * 8. daysUntilExam > 30            → EARLY
 */
@Component
public class ToneKeyResolver {

    public String resolve(Integer daysUntilExam, int recentAttemptCount) {
        if (daysUntilExam == null) return ReadinessConstants.TONE_NO_EXAM;
        if (recentAttemptCount == 0) return ReadinessConstants.TONE_ONBOARDING;
        if (daysUntilExam < 0) return ReadinessConstants.TONE_POST_EXAM;
        if (daysUntilExam == 0) return ReadinessConstants.TONE_TODAY;
        if (daysUntilExam < 7) return ReadinessConstants.TONE_SPRINT;
        if (daysUntilExam < 15) return ReadinessConstants.TONE_PUSH;
        if (daysUntilExam <= 30) return ReadinessConstants.TONE_STEADY;
        return ReadinessConstants.TONE_EARLY;
    }
}
