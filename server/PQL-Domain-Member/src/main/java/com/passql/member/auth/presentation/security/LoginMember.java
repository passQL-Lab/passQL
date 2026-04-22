package com.passql.member.auth.presentation.security;

import com.passql.member.constant.MemberRole;

import java.util.UUID;

public record LoginMember(UUID memberUuid, MemberRole role) {}
