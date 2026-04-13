package com.passql.submission.readiness;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class ReadinessCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 4, 13);

    @Test
    void 이력없으면_recency_기본값과_retry_1점만_반영() {
        // accuracy=0, coverage=0, recency=0.70, difficulty=0, retry=1.0, spread=0
        // score = (0×0.35) + (0×0.25) + (0.70×0.20) + (0×0.10) + (1.0×0.05) + (0×0.05) = 0.19
        ReadinessCalculator.ReadinessResult result = ReadinessCalculator.calculate(
            Collections.emptyList(),
            null,
            0, 9,
            Collections.emptyMap(),
            0L, 0L,
            null,
            TODAY
        );
        assertThat(result.score()).isCloseTo(0.19, within(0.01));
        assertThat(result.retry()).isEqualTo(1.0);
        assertThat(result.spread()).isEqualTo(0.0);
    }

    @Test
    void 모든요소_만점이면_score_1점() {
        List<Boolean> allCorrect = List.of(true, true, true, true, true);
        Map<String, Long> equalSpread = Map.of(
            "t1", 1L, "t2", 1L, "t3", 1L, "t4", 1L, "t5", 1L,
            "t6", 1L, "t7", 1L, "t8", 1L, "t9", 1L
        );
        ReadinessCalculator.ReadinessResult result = ReadinessCalculator.calculate(
            allCorrect,
            TODAY,
            9, 9,
            equalSpread,
            0L, 0L,
            5.0,  // max difficulty
            TODAY
        );
        assertThat(result.score()).isCloseTo(1.0, within(0.01));
    }

    @Test
    void difficulty_정규화_3점은_0점5() {
        // (3-1)/(5-1) = 0.5
        assertThat(ReadinessCalculator.computeDifficulty(3.0)).isCloseTo(0.5, within(0.01));
    }

    @Test
    void difficulty_null이면_0점() {
        assertThat(ReadinessCalculator.computeDifficulty(null)).isEqualTo(0.0);
    }

    @Test
    void retry_오답복습_비율_계산() {
        // wrongCount=4, retriedCount=2 → 0.5
        assertThat(ReadinessCalculator.computeRetry(4L, 2L)).isCloseTo(0.5, within(0.01));
    }

    @Test
    void retry_틀린적_없으면_1점() {
        assertThat(ReadinessCalculator.computeRetry(0L, 0L)).isEqualTo(1.0);
    }

    @Test
    void spread_단일토픽_집중이면_0점() {
        Map<String, Long> skewed = Map.of("t1", 100L);
        assertThat(ReadinessCalculator.computeSpread(skewed, 9)).isCloseTo(0.0, within(0.01));
    }

    @Test
    void spread_균등분포_시_1점() {
        Map<String, Long> equal = Map.of(
            "t1", 10L, "t2", 10L, "t3", 10L, "t4", 10L, "t5", 10L,
            "t6", 10L, "t7", 10L, "t8", 10L, "t9", 10L
        );
        assertThat(ReadinessCalculator.computeSpread(equal, 9)).isCloseTo(1.0, within(0.01));
    }
}
