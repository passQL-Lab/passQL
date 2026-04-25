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
    void 이력없으면_score_0점() {
        // accuracy=0, coverage=0 → base=0 → score=0
        ReadinessCalculator.ReadinessResult result = ReadinessCalculator.calculate(
            Collections.emptyList(),
            null,
            0, 9,
            Collections.emptyMap(),
            0L, 0L,
            TODAY
        );
        assertThat(result.score()).isEqualTo(0.0);
        assertThat(result.retry()).isEqualTo(0.0);  // 틀린 적 없으면 보너스 없음
        assertThat(result.spread()).isEqualTo(0.0);
    }

    @Test
    void 1문제만_맞히면_coverage_비율만큼_score() {
        // accuracy=1.0, coverage=1/9≈0.11, recency=1.0 → base≈0.11, bonus=1.0 → score≈0.11
        ReadinessCalculator.ReadinessResult result = ReadinessCalculator.calculate(
            List.of(true),
            TODAY,
            1, 9,
            Map.of("t1", 1L),
            0L, 0L,
            TODAY
        );
        assertThat(result.score()).isCloseTo(0.11, within(0.02));
    }

    @Test
    void 모든요소_만점이면_score_1점() {
        // accuracy=1.0, coverage=1.0, recency=1.0 → base=1.0
        // retry=1.0, spread=1.0 → bonus=1+0.10+0.05=1.15 → clamp → 1.0
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
            4L, 4L,  // wrongCount=retriedCount → retry=1.0
            TODAY
        );
        assertThat(result.score()).isCloseTo(1.0, within(0.01));
    }

    @Test
    void retry_오답복습_비율_계산() {
        // wrongCount=4, retriedCount=2 → 0.5
        assertThat(ReadinessCalculator.computeRetry(4L, 2L)).isCloseTo(0.5, within(0.01));
    }

    @Test
    void retry_틀린적_없으면_0점_보너스없음() {
        // 틀린 적 없으면 보너스 대상 자체가 없음 → 0
        assertThat(ReadinessCalculator.computeRetry(0L, 0L)).isEqualTo(0.0);
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

    @Test
    void 보너스_최대치_clamp_1점_초과_안됨() {
        // base=1.0, bonus=1.15 → clamp → 1.0
        List<Boolean> allCorrect = List.of(true);
        ReadinessCalculator.ReadinessResult result = ReadinessCalculator.calculate(
            allCorrect,
            TODAY,
            1, 1,  // coverage=1.0
            Map.of("t1", 1L),
            1L, 1L,  // retry=1.0
            TODAY
        );
        assertThat(result.score()).isLessThanOrEqualTo(1.0);
    }
}
