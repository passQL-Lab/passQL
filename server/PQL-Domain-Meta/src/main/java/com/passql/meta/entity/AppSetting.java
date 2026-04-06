package com.passql.meta.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_setting")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppSetting {
    @Id
    private String settingKey;
    private String valueType;
    private String valueText;
    private String category;
    private String description;
}
