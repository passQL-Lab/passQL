package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.UUID;

/**
 * 샌드박스 임시 DB 풀 (MVP: create/drop 방식).
 * <p>
 * acquire() — 임시 DB 생성 + DataSource 반환
 * release(dbName) — DROP DATABASE
 */
@Slf4j
@Component
public class SandboxPool {

    @Value("${sandbox.datasource.url-template}")
    private String urlTemplate;

    @Value("${sandbox.datasource.username}")
    private String username;

    @Value("${sandbox.datasource.password}")
    private String password;

    /**
     * 임시 샌드박스 DB 를 생성하고 이름을 반환한다.
     */
    public String acquire() {
        String dbName = "sandbox_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        try {
            DataSource adminDs = createAdminDataSource();
            try (Connection conn = adminDs.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE DATABASE IF NOT EXISTS `" + dbName + "`");
            }
            log.debug("[SandboxPool] acquired: {}", dbName);
            return dbName;
        } catch (Exception e) {
            log.error("[SandboxPool] acquire 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED,
                    "샌드박스 DB 생성 실패: " + e.getMessage());
        }
    }

    /**
     * 임시 샌드박스 DB를 삭제한다.
     */
    public void release(String dbName) {
        try {
            DataSource adminDs = createAdminDataSource();
            try (Connection conn = adminDs.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("DROP DATABASE IF EXISTS `" + dbName + "`");
            }
            log.debug("[SandboxPool] released: {}", dbName);
        } catch (Exception e) {
            log.warn("[SandboxPool] release 실패 (무시): db={}, error={}", dbName, e.getMessage());
        }
    }

    /**
     * 특정 샌드박스 DB에 대한 DataSource 생성.
     */
    public DataSource createDataSource(String dbName) {
        String baseUrl = urlTemplate.substring(0, urlTemplate.lastIndexOf("/") + 1);
        String params = "";
        int qIdx = urlTemplate.indexOf("?");
        if (qIdx >= 0) {
            params = urlTemplate.substring(qIdx);
        }
        String url = baseUrl + dbName + params;
        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName("org.mariadb.jdbc.Driver")
                .build();
    }

    private DataSource createAdminDataSource() {
        // 기본 DB 없이 서버만 연결
        String url = urlTemplate.substring(0, urlTemplate.lastIndexOf("/") + 1) + "mysql";
        int qIdx = urlTemplate.indexOf("?");
        if (qIdx >= 0) {
            url = urlTemplate.substring(0, urlTemplate.lastIndexOf("/") + 1) + "mysql" + urlTemplate.substring(qIdx);
        }
        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName("org.mariadb.jdbc.Driver")
                .build();
    }
}
