package com.passql.member.auth.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepository {

    private static final String KEY_PREFIX = "refresh_token:";

    private final StringRedisTemplate stringRedisTemplate;

    public void save(UUID memberUuid, String refreshToken, long ttlMillis) {
        stringRedisTemplate.opsForValue().set(
                KEY_PREFIX + memberUuid,
                refreshToken,
                Duration.ofMillis(ttlMillis)
        );
    }

    public String findByMemberUuid(UUID memberUuid) {
        return stringRedisTemplate.opsForValue().get(KEY_PREFIX + memberUuid);
    }

    public void delete(UUID memberUuid) {
        stringRedisTemplate.delete(KEY_PREFIX + memberUuid);
    }
}
