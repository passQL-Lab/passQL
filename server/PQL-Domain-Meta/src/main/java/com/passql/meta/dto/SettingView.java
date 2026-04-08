package com.passql.meta.dto;

public record SettingView(
        String settingKey,
        String valueType,
        String valueText,
        String category,
        String description,
        boolean sensitive
) {}
