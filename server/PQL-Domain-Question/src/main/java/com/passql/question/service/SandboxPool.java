package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.service.AppSettingService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * 샌드박스 임시 DB 풀 (MVP: create/drop 방식).
 * <p>
 * Semaphore로 동시 실행 수를 제한하여 MariaDB 연결 한도 초과를 방지한다.
 * concurrency/wait_seconds 값은 app_setting 테이블에서 실시간으로 읽는다.
 * <p>
 * acquire() — 슬롯 획득 후 임시 DB 생성
 * release(dbName) — DROP DATABASE 후 슬롯 반환
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SandboxPool {

    private static final String KEY_CONCURRENCY  = "sandbox.pool.concurrency";
    private static final String KEY_WAIT_SECONDS = "sandbox.pool.wait_seconds";

    @Value("${sandbox.datasource.url-template}")
    private String urlTemplate;

    @Value("${sandbox.datasource.username}")
    private String username;

    @Value("${sandbox.datasource.password}")
    private String password;

    private final AppSettingService appSettingService;

    private Semaphore semaphore;
    private DataSource adminDataSource;

    @PostConstruct
    public void init() {
        int concurrency = appSettingService.getInt(KEY_CONCURRENCY);
        this.semaphore = new Semaphore(concurrency, true);
        this.adminDataSource = buildAdminDataSource();
        log.info("[SandboxPool] initialized — concurrency={}", concurrency);
    }

    /**
     * 슬롯을 획득하고 임시 샌드박스 DB를 생성한 뒤 dbName을 반환한다.
     * 슬롯이 없으면 app_setting의 sandbox.pool.wait_seconds 초 대기한다.
     */
    public String acquire() {
        int waitSeconds = appSettingService.getInt(KEY_WAIT_SECONDS);

        try {
            boolean acquired = semaphore.tryAcquire(waitSeconds, TimeUnit.SECONDS);
            if (!acquired) {
                throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED,
                        "샌드박스 슬롯 대기 시간 초과 (" + waitSeconds + "s) — 잠시 후 다시 시도해주세요.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED, "샌드박스 슬롯 획득 중 인터럽트 발생");
        }

        String dbName = "sandbox_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        try {
            try (Connection conn = adminDataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE DATABASE IF NOT EXISTS `" + dbName + "`");
            }
            log.debug("[SandboxPool] acquired: {} (permits left={})", dbName, semaphore.availablePermits());
            return dbName;
        } catch (Exception e) {
            semaphore.release(); // DB 생성 실패 시 슬롯 즉시 반환
            log.error("[SandboxPool] acquire 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED,
                    "샌드박스 DB 생성 실패: " + e.getMessage());
        }
    }

    /**
     * 임시 샌드박스 DB를 삭제하고 슬롯을 반환한다.
     */
    public void release(String dbName) {
        try {
            try (Connection conn = adminDataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("DROP DATABASE IF EXISTS `" + dbName + "`");
            }
        } catch (Exception e) {
            log.warn("[SandboxPool] release 실패 (무시): db={}, error={}", dbName, e.getMessage());
        } finally {
            semaphore.release();
            log.debug("[SandboxPool] released: {} (permits left={})", dbName, semaphore.availablePermits());
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

    private DataSource buildAdminDataSource() {
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
