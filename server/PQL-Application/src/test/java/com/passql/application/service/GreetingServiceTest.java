package com.passql.application.service;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

import com.passql.application.dto.GreetingResponse;
import com.passql.common.exception.CustomException;
import com.passql.member.dto.MemberRegisterResponse;
import com.passql.member.service.MemberService;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.api.Assertions;
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
        timeLog(this::존재하지않는_uuid_404예외_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::정상_회원_인사말_반환_테스트);
        lineLog(null);

        lineLog("테스트종료");
    }

    public void 존재하지않는_uuid_404예외_테스트() {
        lineLog("존재하지 않는 memberUuid → CustomException 발생 확인");
        UUID fakeUuid = UUID.randomUUID();
        lineLog("fakeUuid: " + fakeUuid);
        Assertions.assertThatThrownBy(() -> greetingService.getGreeting(fakeUuid))
                .isInstanceOf(CustomException.class);
        lineLog("CustomException 발생 확인 완료");
    }

    public void 정상_회원_인사말_반환_테스트() {
        lineLog("정상 회원 등록 후 인사말 조회 → message 눈으로 확인");
        MemberRegisterResponse registered = memberService.register();
        lineLog("등록된 회원 UUID: " + registered.getMemberUuid());
        lineLog("등록된 닉네임: " + registered.getNickname());

        GreetingResponse response = greetingService.getGreeting(registered.getMemberUuid());
        superLog(response);
        lineLog("message: " + response.message());
    }
}
