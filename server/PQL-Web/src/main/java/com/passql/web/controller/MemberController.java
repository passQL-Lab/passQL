package com.passql.web.controller;

import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.MemberRegisterResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import com.passql.member.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Member", description = "회원 등록 / 조회 / 닉네임 재생성")
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @Operation(summary = "익명 회원 등록", description = "UUID와 닉네임을 자동 발급한다")
    @PostMapping("/register")
    public MemberRegisterResponse register() {
        return memberService.register();
    }

    @Operation(summary = "본인 정보 조회", description = "memberUuid로 본인 정보 조회 + last_seen_at throttled 갱신")
    @GetMapping("/me")
    public MemberMeResponse getMe(@RequestParam("memberUuid") UUID memberUuid) {
        return memberService.getMe(memberUuid);
    }

    @Operation(summary = "닉네임 재생성", description = "본인 닉네임을 새로 발급한다")
    @PostMapping("/me/regenerate-nickname")
    public NicknameRegenerateResponse regenerateNickname(@RequestParam("memberUuid") UUID memberUuid) {
        return memberService.regenerateNickname(memberUuid);
    }
}
