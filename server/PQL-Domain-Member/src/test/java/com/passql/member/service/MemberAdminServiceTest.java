package com.passql.member.service;

import com.passql.member.dto.MemberAdminDetailResponse;
import com.passql.member.dto.MemberAdminListResponse;
import com.passql.member.dto.MemberSearchCondition;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class MemberAdminServiceTest {

    @Autowired
    MemberAdminService memberAdminService;

    @Autowired
    MemberRepository memberRepository;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("MemberAdminService 테스트 시작");

        lineLog(null);
        searchMembers_전체_조회_테스트();
        lineLog(null);

        lineLog(null);
        searchMembers_닉네임_필터_테스트();
        lineLog(null);

        lineLog(null);
        suspendAndUnsuspend_제재_및_해제_테스트();
        lineLog(null);

        lineLog("MemberAdminService 테스트 종료");
    }

    public void searchMembers_전체_조회_테스트() {
        lineLog("회원 전체 조회 테스트");

        MemberSearchCondition cond = new MemberSearchCondition();
        cond.setIncludeTest(true);
        Page<MemberAdminListResponse> result = memberAdminService.searchMembers(
            cond, PageRequest.of(0, 20));

        superLog("전체 회원 수: " + result.getTotalElements());
        lineLog("조회 성공 — 총 " + result.getTotalElements() + "명");
    }

    public void searchMembers_닉네임_필터_테스트() {
        lineLog("닉네임 필터 테스트");

        MemberSearchCondition cond = new MemberSearchCondition();
        cond.setNickname("테스트");
        Page<MemberAdminListResponse> result = memberAdminService.searchMembers(
            cond, PageRequest.of(0, 10));

        superLog("닉네임 '테스트' 포함 회원 수: " + result.getTotalElements());
        lineLog("닉네임 필터 테스트 완료");
    }

    public void suspendAndUnsuspend_제재_및_해제_테스트() {
        lineLog("제재 및 해제 테스트");

        // 첫 번째 회원 조회
        Member member = memberRepository.findAll().stream()
            .filter(m -> !m.isDeleted())
            .findFirst()
            .orElse(null);

        if (member == null) {
            lineLog("테스트할 회원이 없습니다. SKIP");
            return;
        }

        UUID uuid = member.getMemberUuid();
        lineLog("대상 회원 UUID: " + uuid);

        // 제재
        LocalDateTime suspendUntil = LocalDateTime.now().plusDays(1);
        memberAdminService.suspendMember(uuid, "테스트 제재", suspendUntil);
        superLog("제재 후 상태: " + memberRepository.findByMemberUuidAndIsDeletedFalse(uuid)
            .map(m -> m.getStatus().name()).orElse("NOT FOUND"));

        // 상세 조회로 이력 확인
        MemberAdminDetailResponse detail = memberAdminService.getMemberDetail(uuid);
        superLog("제재 이력 수: " + detail.suspendHistories().size());

        // 해제
        memberAdminService.unsuspendMember(uuid);
        superLog("해제 후 상태: " + memberRepository.findByMemberUuidAndIsDeletedFalse(uuid)
            .map(m -> m.getStatus().name()).orElse("NOT FOUND"));

        lineLog("제재/해제 테스트 완료");
    }
}
