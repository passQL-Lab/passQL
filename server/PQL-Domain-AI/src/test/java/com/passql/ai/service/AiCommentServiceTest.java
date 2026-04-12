package com.passql.ai.service;

import com.passql.ai.dto.AiCommentResponse;
import com.passql.application.service.AiCommentService;
import com.passql.submission.dto.TopicAnalysisResponse;
import com.passql.submission.service.TopicAnalysisService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static kr.suhsaechan.suhlogger.util.SuhLogger.*;

@SpringBootTest(classes = com.passql.web.PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class AiCommentServiceTest {

    @Autowired AiCommentService aiCommentService;
    @Autowired TopicAnalysisService topicAnalysisService;

    // 테스트 시 실제 존재하는 memberUuid/sessionUuid로 교체
    private static final UUID TEST_MEMBER_UUID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID TEST_SESSION_UUID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    @Transactional
    public void mainTest() {
        lineLog("테스트 시작");

        lineLog(null);
        timeLog(this::토픽_분석_조회_테스트);
        lineLog(null);
        timeLog(this::AI_코멘트_조회_테스트);
        lineLog(null);

        lineLog("테스트 종료");
    }

    public void 토픽_분석_조회_테스트() {
        lineLog("토픽별 분석 조회");
        TopicAnalysisResponse response = topicAnalysisService.getTopicAnalysis(TEST_MEMBER_UUID);
        superLog(response);
    }

    public void AI_코멘트_조회_테스트() {
        lineLog("AI 코멘트 조회 (캐시 miss → Gemini 호출)");
        aiCommentService.evictCache(TEST_MEMBER_UUID, TEST_SESSION_UUID); // 캐시 초기화
        AiCommentResponse response = aiCommentService.getAiComment(TEST_MEMBER_UUID, TEST_SESSION_UUID);
        superLog(response);
    }
}
