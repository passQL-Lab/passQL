package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.ExecuteResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * 샌드박스 DB에서 SQL을 실행하고 결과를 반환한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SandboxExecutor {

    private final SandboxPool sandboxPool;

    /**
     * 특정 샌드박스 DB에 DDL + sample data 를 적용한다.
     */
    public void applyDdl(String dbName, String ddl) {
        // HikariPool 누수 방지: 사용 후 DataSource(HikariDataSource)를 명시적으로 close
        DataSource ds = sandboxPool.createDataSource(dbName);
        try {
            try (Connection conn = ds.getConnection();
                 Statement stmt = conn.createStatement()) {
                String[] tokens = splitStatements(ddl);
                log.debug("[applyDdl] DB={} 총 {}개 토큰", dbName, tokens.length);
                for (int i = 0; i < tokens.length; i++) {
                    String sql = tokens[i];
                    if (!sql.isBlank()) {
                        String normalized = normalizeDdl(sql.trim());
                        log.debug("[applyDdl] [{}/{}] 실행: {}", i + 1, tokens.length,
                                normalized.length() > 120 ? normalized.substring(0, 120) + "..." : normalized);
                        stmt.execute(normalized);
                    }
                }
            }
        } catch (Exception e) {
            throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED,
                    "DDL 적용 실패: " + e.getMessage());
        } finally {
            closeDataSource(ds);
        }
    }

    /**
     * CREATE TABLE → CREATE TABLE IF NOT EXISTS 자동 변환.
     * 관리자가 IF NOT EXISTS를 빠뜨려도 sandbox에서 안전하게 실행되도록 보정한다.
     */
    private String normalizeDdl(String sql) {
        String upper = sql.toUpperCase();
        if (upper.startsWith("CREATE TABLE") && !upper.startsWith("CREATE TABLE IF NOT EXISTS")) {
            return sql.replaceFirst("(?i)CREATE\\s+TABLE\\s+", "CREATE TABLE IF NOT EXISTS ");
        }
        return sql;
    }

    /**
     * 샌드박스 DB에서 SQL을 실행하고 결과를 반환한다.
     */
    public ExecuteResult execute(String dbName, String sql) {
        // HikariPool 누수 방지: 사용 후 DataSource(HikariDataSource)를 명시적으로 close
        DataSource ds = sandboxPool.createDataSource(dbName);
        long started = System.currentTimeMillis();
        try {
            try (Connection conn = ds.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.setQueryTimeout(10); // 10초 타임아웃

                boolean hasResultSet = stmt.execute(sql);
                long elapsed = System.currentTimeMillis() - started;

                if (hasResultSet) {
                    ResultSet rs = stmt.getResultSet();
                    ResultSetMetaData meta = rs.getMetaData();
                    int colCount = meta.getColumnCount();
                    List<String> columns = new ArrayList<>();
                    for (int i = 1; i <= colCount; i++) {
                        columns.add(meta.getColumnLabel(i));
                    }
                    List<List<Object>> rows = new ArrayList<>();
                    while (rs.next()) {
                        List<Object> row = new ArrayList<>();
                        for (int i = 1; i <= colCount; i++) {
                            row.add(rs.getObject(i));
                        }
                        rows.add(row);
                    }
                    return new ExecuteResult("OK", columns, rows, rows.size(), elapsed, null, null);
                } else {
                    return new ExecuteResult("OK", List.of(), List.of(), 0, elapsed, null, null);
                }
            }
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - started;
            return new ExecuteResult("ERROR", List.of(), List.of(), 0, elapsed,
                    e.getClass().getSimpleName(), e.getMessage());
        } finally {
            closeDataSource(ds);
        }
    }

    private String[] splitStatements(String sql) {
        return sql.split(";");
    }

    /**
     * DataSource가 HikariDataSource인 경우 close하여 커넥션 풀을 반환한다.
     * 매 실행마다 새 HikariPool을 생성하므로, 사용 후 반드시 닫아야 커넥션 누수를 막을 수 있다.
     */
    private void closeDataSource(DataSource ds) {
        if (ds instanceof AutoCloseable closeable) {
            try {
                closeable.close();
            } catch (Exception e) {
                log.warn("[SandboxExecutor] DataSource close 실패 (무시): {}", e.getMessage());
            }
        }
    }
}
