package com.passql.submission.service;

import com.passql.submission.dto.HeatmapResponse;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static kr.suhsaechan.suhlogger.util.SuhLogger.*;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class ProgressServiceTest {

    @Autowired ProgressService progressService;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("테스트시작");

        lineLog(null);
        timeLog(this::히트맵_조회_테스트);
        lineLog(null);
        timeLog(this::히트맵_빈결과_테스트);
        lineLog(null);
        timeLog(this::히트맵_기간지정_테스트);
        lineLog(null);

        lineLog("테스트종료");
    }

    public void 히트맵_조회_테스트() {
        lineLog("히트맵 조회 — 기본 파라미터 (from=null, to=null → 최근 30일)");
        // 실제 DB에 존재하는 memberUuid로 교체 필요
        UUID memberUuid = UUID.fromString("00000000-0000-0000-0000-000000000001");
        HeatmapResponse response = progressService.getHeatmap(memberUuid, null, null);
        superLog(response);
    }

    public void 히트맵_빈결과_테스트() {
        lineLog("히트맵 조회 — 데이터 없는 기간");
        UUID memberUuid = UUID.fromString("00000000-0000-0000-0000-000000000001");
        HeatmapResponse response = progressService.getHeatmap(
            memberUuid,
            LocalDate.of(2020, 1, 1),
            LocalDate.of(2020, 1, 31)
        );
        superLog(response);
    }

    public void 히트맵_기간지정_테스트() {
        lineLog("히트맵 조회 — 특정 기간 지정");
        UUID memberUuid = UUID.fromString("00000000-0000-0000-0000-000000000001");
        HeatmapResponse response = progressService.getHeatmap(
            memberUuid,
            LocalDate.of(2026, 4, 1),
            LocalDate.of(2026, 4, 10)
        );
        superLog(response);
    }
}
