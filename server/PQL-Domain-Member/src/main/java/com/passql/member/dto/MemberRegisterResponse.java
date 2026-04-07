package com.passql.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class MemberRegisterResponse {
    private UUID memberUuid;
    private String nickname;
}
