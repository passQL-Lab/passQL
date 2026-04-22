package com.passql.member.auth.application.dto.command;

import com.passql.member.constant.AuthProvider;

public record LoginCommand(AuthProvider authProvider, String idToken) {}
