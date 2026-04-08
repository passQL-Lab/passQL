package com.passql.meta.repository;

import com.passql.meta.entity.AppSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppSettingRepository extends JpaRepository<AppSetting, UUID> {
    Optional<AppSetting> findBySettingKey(String settingKey);
    List<AppSetting> findByCategoryOrderBySettingKeyAsc(String category);
}
