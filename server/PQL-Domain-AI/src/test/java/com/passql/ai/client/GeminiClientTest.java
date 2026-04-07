package com.passql.ai.client;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

import com.google.genai.types.Schema;
import com.google.genai.types.Type;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class GeminiClientTest {

    @Autowired
    GeminiClient geminiClient;

    @Test
    public void mainTest() {
        lineLog("테스트 시작");

        lineLog(null);
        timeLog(this::geminiClient_일반_텍스트_응답_테스트);
        lineLog(null);

//        lineLog(null);
//        timeLog(this::geminiClient_JSON_강제_응답_테스트);
//        lineLog(null);

        lineLog("테스트 종료");
    }

    public void geminiClient_일반_텍스트_응답_테스트() {
        String systemPrompt = "당신은 SQL 학습을 도와주는 전문 튜터입니다.";
        String userPrompt = "SELECT 와 WHERE 절의 실행 순서를 한 문장으로 설명해 주세요.";

        lineLog("일반 텍스트 응답 테스트");
        superLog(systemPrompt);
        superLog( userPrompt);

        String result = geminiClient.chat(systemPrompt, userPrompt, 0.5f, 256);

        lineLog("응답 결과");
        superLog(result);
    }

    public void geminiClient_JSON_강제_응답_테스트() {
        String systemPrompt = "당신은 SQL 학습을 도와주는 전문 튜터입니다.";
        String userPrompt = "NULL 처리 함수 NVL과 COALESCE의 차이를 JSON으로 설명해 주세요.";

        Schema schema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "explanation", Schema.builder().type(Type.Known.STRING).build(),
                        "nvl_example", Schema.builder().type(Type.Known.STRING).build(),
                        "coalesce_example", Schema.builder().type(Type.Known.STRING).build()
                ))
                .required(java.util.List.of("explanation", "nvl_example", "coalesce_example"))
                .build();

        lineLog("JSON 강제 응답 테스트");
        superLog(systemPrompt);
        superLog(userPrompt);

        String result = geminiClient.chatStructured(systemPrompt, userPrompt, 0.5f, 512, schema);

        lineLog("응답 결과 (JSON)");
        superLog(result);
    }
}
