package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.dto.SettingView;
import com.passql.meta.entity.AppSetting;
import com.passql.meta.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppSettingService {

    public static final String REDIS_PREFIX = "passql:settings:";

    // settingKey에 이 문자열이 포함되면 값을 마스킹 처리
    private static final Set<String> MASK_KEYWORDS = Set.of("key", "secret", "password", "token");

    private final AppSettingRepository appSettingRepository;
    private final StringRedisTemplate redisTemplate;

    public String getString(String key) {
        String cached = redisTemplate.opsForValue().get(REDIS_PREFIX + key);
        if (cached != null) return cached;

        String value = appSettingRepository.findBySettingKey(key)
                .map(AppSetting::getValueText)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTING_NOT_FOUND));

        redisTemplate.opsForValue().set(REDIS_PREFIX + key, value);
        return value;
    }

    public int getInt(String key) { return Integer.parseInt(getString(key)); }

    public boolean getBoolean(String key) { return Boolean.parseBoolean(getString(key)); }

    public List<AppSetting> findAll() {
        return appSettingRepository.findAll(Sort.by("category", "settingKey"));
    }

    /** 마스킹 처리된 SettingView 목록 반환 — Controller에 변환 로직 두지 않음 */
    public List<SettingView> findAllAsView() {
        return findAll().stream()
                .map(s -> {
                    boolean sensitive = isSensitiveKey(s.getSettingKey());
                    return new SettingView(
                            s.getSettingKey(),
                            s.getValueType(),
                            sensitive ? maskValue(s.getValueText()) : s.getValueText(),
                            s.getCategory(),
                            s.getDescription(),
                            sensitive
                    );
                })
                .toList();
    }

    @Transactional
    public void save(String key, String value) {
        AppSetting setting = appSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTING_NOT_FOUND));
        setting.setValueText(value);
        appSettingRepository.save(setting);
        redisTemplate.opsForValue().set(REDIS_PREFIX + key, value);
    }

    /** key에 민감 키워드가 포함되면 true — UI에서 마스킹 처리 */
    public static boolean isSensitiveKey(String key) {
        String lower = key.toLowerCase();
        return MASK_KEYWORDS.stream().anyMatch(lower::contains);
    }

    /** 민감 값 마스킹: 마지막 3자리만 보여주고 앞은 * 처리 */
    public static String maskValue(String value) {
        if (value == null || value.length() <= 3) return "***";
        return "*".repeat(value.length() - 3) + value.substring(value.length() - 3);
    }
}
