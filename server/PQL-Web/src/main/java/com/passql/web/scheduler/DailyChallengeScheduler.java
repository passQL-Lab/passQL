package com.passql.web.scheduler;

import com.passql.question.service.AdminDailyChallengeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyChallengeScheduler {

    private final AdminDailyChallengeService adminDailyChallengeService;

    /**
     * 매일 자정에 당일 daily_challenge 배정이 없으면 폴백 결과를 저장한다.
     * 활성 문제가 없는 경우 저장을 건너뛴다.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void confirmTodayChallenge() {
        LocalDate today = LocalDate.now();
        log.info("[DailyChallengeScheduler] 오늘의 챌린지 폴백 저장 시작: date={}", today);
        try {
            adminDailyChallengeService.confirmFallback(today);
            log.info("[DailyChallengeScheduler] 완료: date={}", today);
        } catch (Exception e) {
            // 스케줄러 실패 시 resolveTodayQuestion() 백업이 동작하므로 예외 삼킴
            log.error("[DailyChallengeScheduler] 폴백 저장 실패: date={}, error={}", today, e.getMessage(), e);
        }
    }
}
