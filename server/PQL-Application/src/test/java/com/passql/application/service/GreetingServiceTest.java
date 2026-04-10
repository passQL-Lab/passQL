package com.passql.application.service;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

import com.passql.application.constant.GreetingMessageType;
import com.passql.application.dto.GreetingResponse;
import com.passql.member.dto.MemberRegisterResponse;
import com.passql.member.service.MemberService;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class GreetingServiceTest {

    @Autowired GreetingService greetingService;
    @Autowired MemberService memberService;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("테스트시작");

        lineLog(null);
        timeLog(this::존재하지않는_uuid_폴백_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::null_uuid_폴백_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::정상_회원_인사말_반환_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::정상_회원_반복호출_다양성_확인_테스트);
        lineLog(null);

        lineLog("테스트종료");
    }

    public void 존재하지않는_uuid_폴백_테스트() {
        lineLog("존재하지 않는 memberUuid → 예외 없이 '회원' + GENERAL 폴백");
        UUID fakeUuid = UUID.randomUUID();
        lineLog("fakeUuid: " + fakeUuid);

        GreetingResponse response = greetingService.getGreeting(fakeUuid);
        superLog(response);

        lineLog("nickname: " + response.nickname());
        lineLog("messageType: " + response.messageType());
        lineLog("message: " + response.message());

        if (!"회원".equals(response.nickname())) {
            throw new AssertionError("fallback nickname이 '회원'이 아님: " + response.nickname());
        }
        if (response.messageType() != GreetingMessageType.GENERAL) {
            throw new AssertionError("fallback messageType이 GENERAL이 아님: " + response.messageType());
        }
    }

    public void null_uuid_폴백_테스트() {
        lineLog("memberUuid == null → 예외 없이 '회원' + GENERAL 폴백");

        GreetingResponse response = greetingService.getGreeting(null);
        superLog(response);

        if (!"회원".equals(response.nickname())) {
            throw new AssertionError("fallback nickname이 '회원'이 아님: " + response.nickname());
        }
        if (response.messageType() != GreetingMessageType.GENERAL) {
            throw new AssertionError("fallback messageType이 GENERAL이 아님: " + response.messageType());
        }
    }

    public void 정상_회원_인사말_반환_테스트() {
        lineLog("정상 회원 등록 후 인사말 조회 → 전체 응답 눈으로 확인");
        MemberRegisterResponse registered = memberService.register();
        lineLog("등록된 회원 UUID: " + registered.getMemberUuid());
        lineLog("등록된 닉네임: " + registered.getNickname());

        GreetingResponse response = greetingService.getGreeting(registered.getMemberUuid());
        superLog(response);

        lineLog("nickname: " + response.nickname());
        lineLog("messageType: " + response.messageType());
        lineLog("message: " + response.message());
    }

    public void 정상_회원_반복호출_다양성_확인_테스트() {
        lineLog("같은 회원으로 10회 호출 → 응답 다양성 눈으로 확인 (랜덤 풀 동작)");
        MemberRegisterResponse registered = memberService.register();
        lineLog("등록된 닉네임: " + registered.getNickname());

        for (int i = 0; i < 10; i++) {
            GreetingResponse response = greetingService.getGreeting(registered.getMemberUuid());
            lineLog("[" + (i + 1) + "] type=" + response.messageType() + " | " + response.message());
        }
    }

}
