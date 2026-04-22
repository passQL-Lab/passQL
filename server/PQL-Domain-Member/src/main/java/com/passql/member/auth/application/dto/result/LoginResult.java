package com.passql.member.auth.application.dto.result;

import com.passql.member.auth.domain.Tokens;
import com.passql.member.entity.Member;

public record LoginResult(Member member, boolean isNewMember, Tokens tokens) {

    public static LoginResult of(Member member, boolean isNewMember, Tokens tokens) {
        return new LoginResult(member, isNewMember, tokens);
    }
}
