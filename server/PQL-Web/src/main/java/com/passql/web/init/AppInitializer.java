package com.passql.web.init;

import com.passql.meta.entity.AppSetting;
import com.passql.meta.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

import static com.passql.meta.service.AppSettingService.REDIS_PREFIX;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppInitializer implements ApplicationRunner {

    @Value("${gemini.api-key:}")
    private String geminiApiKeyFromYml;

    @Value("${sandbox.pool.concurrency:30}")
    private int sandboxConcurrencyFromYml;

    @Value("${sandbox.pool.wait-seconds:60}")
    private int sandboxWaitSecondsFromYml;

    private final AppSettingRepository appSettingRepository;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        syncGeminiApiKey();
        syncSettingFromYml("sandbox.pool.concurrency", String.valueOf(sandboxConcurrencyFromYml));
        syncSettingFromYml("sandbox.pool.wait_seconds", String.valueOf(sandboxWaitSecondsFromYml));
    }

    /**
     * 서버 시작 시 Gemini API Key를 Redis에 올린다.
     *
     * 우선순위:
     * 1. DB에 값이 있으면 → Redis에 적재 (DB가 진원)
     * 2. DB가 비어있고 yml에 값이 있으면 → DB에 저장 후 Redis 적재
     * 3. 둘 다 없으면 → 경고만 (AI 서버는 키 없이 기동되고 호출 시점에 에러)
     */
    private void syncGeminiApiKey() {
        Optional<AppSetting> opt = appSettingRepository.findBySettingKey("ai.gemini_api_key");
        if (opt.isEmpty()) {
            log.warn("[AppInitializer] ai.gemini_api_key 행이 DB에 없음 — 마이그레이션 확인 필요");
            return;
        }

        AppSetting setting = opt.get();

        if (StringUtils.hasText(setting.getValueText())) {
            // DB에 값 있음 → Redis 워밍업
            redisTemplate.opsForValue().set(REDIS_PREFIX + "ai.gemini_api_key", setting.getValueText());
            log.info("[AppInitializer] ai.gemini_api_key Redis 워밍업 완료 (DB → Redis)");
            return;
        }

        // DB가 비어있음 → yml 값으로 채우기
        if (!StringUtils.hasText(geminiApiKeyFromYml)) {
            log.warn("[AppInitializer] ai.gemini_api_key DB도 비어있고 yml에도 없음 — Gemini 기능 비활성");
            return;
        }

        setting.setValueText(geminiApiKeyFromYml);
        appSettingRepository.save(setting);
        redisTemplate.opsForValue().set(REDIS_PREFIX + "ai.gemini_api_key", geminiApiKeyFromYml);
        log.info("[AppInitializer] ai.gemini_api_key yml → DB 적재 및 Redis 워밍업 완료");
    }

    /**
     * 설정값 동기화 공통 메서드.
     *
     * 우선순위:
     * 1. DB에 값이 있으면 → Redis 워밍업 (DB가 진원)
     * 2. DB가 비어있으면 → yml 기본값을 DB에 저장 후 Redis 적재
     * 3. DB 행 자체가 없으면 → 경고만 (마이그레이션 누락)
     */
    private void syncSettingFromYml(String key, String ymlValue) {
        Optional<AppSetting> opt = appSettingRepository.findBySettingKey(key);
        if (opt.isEmpty()) {
            log.warn("[AppInitializer] {} 행이 DB에 없음 — 마이그레이션 확인 필요", key);
            return;
        }

        AppSetting setting = opt.get();

        if (StringUtils.hasText(setting.getValueText())) {
            redisTemplate.opsForValue().set(REDIS_PREFIX + key, setting.getValueText());
            log.info("[AppInitializer] {} Redis 워밍업 완료 (DB → Redis)", key);
            return;
        }

        setting.setValueText(ymlValue);
        appSettingRepository.save(setting);
        redisTemplate.opsForValue().set(REDIS_PREFIX + key, ymlValue);
        log.info("[AppInitializer] {} yml 기본값({}) → DB 적재 및 Redis 워밍업 완료", key, ymlValue);
    }
}
