package com.passql.member.auth.infrastructure.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(TokenConfig access, TokenConfig refresh) {

    public record TokenConfig(String secret, Duration expiration) {}
}
