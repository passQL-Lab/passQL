package com.passql.web.controller.admin;

import com.passql.question.dto.ExecuteResult;
import com.passql.question.service.SandboxExecutor;
import com.passql.question.service.SandboxPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 관리자 등록 폼의 [샌드박스 실행 테스트] 버튼용.
 */
@Slf4j
@RestController
@RequestMapping("/admin/sandbox")
@RequiredArgsConstructor
public class AdminSandboxController {

    private final SandboxPool sandboxPool;
    private final SandboxExecutor sandboxExecutor;

    @PostMapping("/execute")
    public ResponseEntity<ExecuteResult> execute(@RequestBody ExecuteRequest request) {
        String dbName = sandboxPool.acquire();
        try {
            // DDL + sample data 적용
            String setupSql = request.ddl();
            if (request.sampleData() != null && !request.sampleData().isBlank()) {
                setupSql = setupSql + ";\n" + request.sampleData();
            }
            sandboxExecutor.applyDdl(dbName, setupSql);

            // SQL 실행
            ExecuteResult result = sandboxExecutor.execute(dbName, request.sql());
            return ResponseEntity.ok(result);
        } finally {
            sandboxPool.release(dbName);
        }
    }

    public record ExecuteRequest(String ddl, String sampleData, String sql) {}
}
