package com.passql.submission.util;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

public final class StreakCalculator {

    private StreakCalculator() {}

    /**
     * 제출 날짜 목록(내림차순)으로 연속 학습 일수를 계산한다.
     * 하루 그레이스 정책: 오늘 미제출이어도 어제까지 연속이면 streak 유지.
     *
     * @param dates 제출 날짜 목록 (DESC 정렬, distinct)
     * @return 연속 학습 일수
     */
    public static int calculate(List<Date> dates) {
        if (dates == null || dates.isEmpty()) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        int streak = 0;
        LocalDate expected = today;
        boolean started = false;
        for (Date d : dates) {
            LocalDate ld = d.toLocalDate();
            if (!started) {
                if (ld.equals(today) || ld.equals(today.minusDays(1))) {
                    streak = 1;
                    expected = ld.minusDays(1);
                    started = true;
                } else {
                    return 0;
                }
            } else {
                if (ld.equals(expected)) {
                    streak++;
                    expected = expected.minusDays(1);
                } else if (ld.isBefore(expected)) {
                    break;
                }
            }
        }
        return streak;
    }
}
