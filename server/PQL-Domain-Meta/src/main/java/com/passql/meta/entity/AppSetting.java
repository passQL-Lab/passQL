package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(
    name = "app_setting",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_app_setting_key", columnNames = "setting_key")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class AppSetting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID appSettingUuid;

    @Column(nullable = false, length = 100)
    private String settingKey;

    @Column(length = 50)
    private String valueType;

    @Column(columnDefinition = "TEXT")
    private String valueText;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;
}
