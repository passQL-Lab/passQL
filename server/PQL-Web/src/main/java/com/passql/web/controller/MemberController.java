package com.passql.web.controller;

import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import com.passql.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController implements MemberControllerDocs {

    private final MemberService memberService;

    @GetMapping("/me")
    public MemberMeResponse getMe(@RequestParam("memberUuid") UUID memberUuid) {
        return memberService.getMe(memberUuid);
    }

    @PostMapping("/me/regenerate-nickname")
    public NicknameRegenerateResponse regenerateNickname(@RequestParam("memberUuid") UUID memberUuid) {
        return memberService.regenerateNickname(memberUuid);
    }
}
