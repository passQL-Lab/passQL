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

    private final AppSettingRepository appSettingRepository;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        syncGeminiApiKey();
    }

    private void syncGeminiApiKey() {
        if (!StringUtils.hasText(geminiApiKeyFromYml)) {
            log.warn("[AppInitializer] gemini.api-key 가 yml에 없음 — DB 적재 스킵");
            return;
        }

        Optional<AppSetting> opt = appSettingRepository.findBySettingKey("ai.gemini_api_key");
        if (opt.isEmpty()) {
            log.warn("[AppInitializer] ai.gemini_api_key 행이 DB에 없음 — 마이그레이션 확인 필요");
            return;
        }

        AppSetting setting = opt.get();
        if (StringUtils.hasText(setting.getValueText())) {
            log.info("[AppInitializer] ai.gemini_api_key 이미 DB에 존재 — 스킵");
            return;
        }

        setting.setValueText(geminiApiKeyFromYml);
        appSettingRepository.save(setting);
        redisTemplate.opsForValue().set(REDIS_PREFIX + "ai.gemini_api_key", geminiApiKeyFromYml);
        log.info("[AppInitializer] ai.gemini_api_key DB 적재 완료");
    }
}
