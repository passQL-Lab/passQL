package com.passql.web.controller;

import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameChangeRequest;
import com.passql.member.dto.NicknameChangeResponse;
import com.passql.member.dto.NicknameCheckResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import com.passql.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController implements MemberControllerDocs {

    private final MemberService memberService;

    @GetMapping("/me")
    public MemberMeResponse getMe(@AuthMember LoginMember loginMember) {
        return memberService.getMe(loginMember.memberUuid());
    }

    @PostMapping("/me/regenerate-nickname")
    public NicknameRegenerateResponse regenerateNickname(@AuthMember LoginMember loginMember) {
        return memberService.regenerateNickname(loginMember.memberUuid());
    }

    // 닉네임 중복 확인 — 저장 없이 사용 가능 여부만 반환
    @GetMapping("/me/nickname/check")
    public NicknameCheckResponse checkNickname(
            @AuthMember LoginMember loginMember,
            @RequestParam String nickname) {
        return memberService.checkNickname(nickname);
    }

    // 닉네임 직접 변경 — 쿨다운·중복·유효성 검증 포함
    @PatchMapping("/me/nickname")
    public NicknameChangeResponse changeNickname(
            @AuthMember LoginMember loginMember,
            @Valid @RequestBody NicknameChangeRequest request) {
        return memberService.changeNickname(loginMember.memberUuid(), request);
    }
}
