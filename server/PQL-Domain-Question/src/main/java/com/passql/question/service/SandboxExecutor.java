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
        DataSource ds = sandboxPool.createDataSource(dbName);
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String sql : splitStatements(ddl)) {
                if (!sql.isBlank()) {
                    stmt.execute(normalizeDdl(sql.trim()));
                }
            }
        } catch (Exception e) {
            throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED,
                    "DDL 적용 실패: " + e.getMessage());
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
        DataSource ds = sandboxPool.createDataSource(dbName);
        long started = System.currentTimeMillis();
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
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - started;
            return new ExecuteResult("ERROR", List.of(), List.of(), 0, elapsed,
                    e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private String[] splitStatements(String sql) {
        return sql.split(";");
    }
}
