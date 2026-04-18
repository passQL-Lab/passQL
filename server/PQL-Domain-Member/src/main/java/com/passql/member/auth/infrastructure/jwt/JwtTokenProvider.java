package com.passql.member.auth.infrastructure.jwt;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.MemberRole;
import com.passql.member.entity.Member;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final String CLAIM_ROLE = "role";

    private final JwtProperties jwtProperties;
    private final Key accessKey;
    private final Key refreshKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.accessKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.access().secret()));
        this.refreshKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.refresh().secret()));
    }

    public String createAccessToken(Member member) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.access().expiration().toMillis());
        return Jwts.builder()
                .setSubject(member.getMemberUuid().toString())
                .claim(CLAIM_ROLE, member.getRole().name())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(accessKey)
                .compact();
    }

    public String createRefreshToken(Member member) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.refresh().expiration().toMillis());
        return Jwts.builder()
                .setSubject(member.getMemberUuid().toString())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(refreshKey)
                .compact();
    }

    public UUID getMemberUuidFromAccessToken(String token) {
        return UUID.fromString(getAccessClaims(token).getSubject());
    }

    public MemberRole getRoleFromAccessToken(String token) {
        return MemberRole.valueOf(getAccessClaims(token).get(CLAIM_ROLE, String.class));
    }

    public UUID getMemberUuidFromRefreshToken(String token) {
        return UUID.fromString(getRefreshClaims(token).getSubject());
    }

    /** 만료된 RefreshToken도 subject 파싱 허용 (재발급 시 Redis 정리용). */
    public Optional<UUID> getMemberUuidFromRefreshTokenSilently(String token) {
        try {
            return Optional.of(UUID.fromString(
                    Jwts.parserBuilder().setSigningKey(refreshKey).build()
                            .parseClaimsJws(token).getBody().getSubject()));
        } catch (ExpiredJwtException e) {
            return Optional.of(UUID.fromString(e.getClaims().getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long getRefreshTokenExpirationMillis() {
        return jwtProperties.refresh().expiration().toMillis();
    }

    private Claims getAccessClaims(String token) {
        try {
            return Jwts.parserBuilder().setSigningKey(accessKey).build()
                    .parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.ACCESS_TOKEN_EXPIRED);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.UNAUTHENTICATED_REQUEST);
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }

    private Claims getRefreshClaims(String token) {
        try {
            return Jwts.parserBuilder().setSigningKey(refreshKey).build()
                    .parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.UNAUTHENTICATED_REQUEST);
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }
}
