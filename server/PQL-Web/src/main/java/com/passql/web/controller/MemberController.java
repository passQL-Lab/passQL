package com.passql.web.controller;

import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.member.dto.ChoiceGenerationModeUpdateRequest;
import com.passql.member.dto.ChoiceGenerationModeUpdateResponse;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameChangeRequest;
import com.passql.member.dto.NicknameChangeResponse;
import com.passql.member.dto.NicknameCheckResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import com.passql.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
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
@Validated
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
    // @Pattern은 인터페이스(MemberControllerDocs)에 선언 — 구현체 재정의 시 HV000151 오류 발생
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

    // 선택지 생성 모드 변경 — PRACTICE(재사용) / REAL(항상 새로 생성)
    @PatchMapping("/me/settings/choice-generation-mode")
    public ChoiceGenerationModeUpdateResponse updateChoiceGenerationMode(
            @AuthMember LoginMember loginMember,
            @Valid @RequestBody ChoiceGenerationModeUpdateRequest request) {
        return memberService.updateChoiceGenerationMode(loginMember.memberUuid(), request);
    }
}
