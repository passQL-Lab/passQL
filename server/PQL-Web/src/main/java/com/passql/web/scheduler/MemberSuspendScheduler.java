package com.passql.web.scheduler;

import com.passql.member.service.MemberAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberSuspendScheduler {

    private final MemberAdminService memberAdminService;

    /** 1분마다 만료된 제재 자동 해제 */
    @Scheduled(fixedDelay = 60_000)
    public void autoUnsuspendExpired() {
        memberAdminService.autoUnsuspendExpired();
    }
}
