package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppSettingService {
    private final AppSettingRepository appSettingRepository;

    @Cacheable(value = "appSettings", key = "#key")
    public String getString(String key) {
        return appSettingRepository.findById(key)
                .map(s -> s.getValueText())
                .orElseThrow(() -> new CustomException(ErrorCode.SETTING_NOT_FOUND));
    }

    @Cacheable(value = "appSettings", key = "#key")
    public int getInt(String key) { return Integer.parseInt(getString(key)); }

    @Cacheable(value = "appSettings", key = "#key")
    public boolean getBoolean(String key) { return Boolean.parseBoolean(getString(key)); }

    @CacheEvict(value = "appSettings", allEntries = true)
    public void save(String key, String value) {
        // TODO: save
        throw new UnsupportedOperationException("TODO");
    }
}
