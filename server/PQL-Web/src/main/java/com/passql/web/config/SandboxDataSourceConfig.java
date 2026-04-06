package com.passql.web.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * 샌드박스 DataSource 팩토리.
 * 문제 ID별로 동적 DataSource를 생성한다. (스프링 빈으로 등록하지 않음)
 */
@Component
public class SandboxDataSourceConfig {

    @Value("${sandbox.datasource.url-template}")
    private String urlTemplate;

    @Value("${sandbox.datasource.username}")
    private String username;

    @Value("${sandbox.datasource.password}")
    private String password;

    public DataSource createForQuestion(Long questionId) {
        String url = urlTemplate.replace("{id}", String.valueOf(questionId));
        return DataSourceBuilder.create()
            .url(url)
            .username(username)
            .password(password)
            .driverClassName("org.mariadb.jdbc.Driver")
            .build();
    }
}
