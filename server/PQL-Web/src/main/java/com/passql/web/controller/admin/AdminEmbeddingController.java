package com.passql.web.controller.admin;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.IndexQuestionsBulkResult;
import com.passql.ai.dto.IndexStatusRequest;
import com.passql.ai.dto.IndexStatusResult;
import com.passql.question.service.QuestionGenerateService;
import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;

/**
 * 관리자 Qdrant 임베딩 인덱스 관리 화면 컨트롤러.
 * - GET  /admin/embeddings         : 색인 상태 대시보드
 * - POST /admin/embeddings/index-all      : 전체 재색인
 * - POST /admin/embeddings/index-selected : 선택 문제 재색인 (JSON API)
 */
@Slf4j
@Controller
@RequestMapping("/admin/embeddings")
@RequiredArgsConstructor
public class AdminEmbeddingController {

    private final QuestionService questionService;
    private final QuestionGenerateService questionGenerateService;
    private final AiGatewayClient aiGatewayClient;

    @GetMapping
    public String index(Model model) {
        log.info("[admin-embeddings] 색인 상태 페이지 요청");

        // DB 전체 활성 문제 UUID 조회 후 AI 서버에 상태 확인 요청
        List<String> allUuids = questionService.getAllActiveQuestionUuids();
        log.info("[admin-embeddings] DB 활성 문제 수={}", allUuids.size());

        IndexStatusResult status = null;
        try {
            status = aiGatewayClient.getIndexStatus(new IndexStatusRequest(allUuids));
        } catch (Exception e) {
            // AI 서버 장애 — 화면에 에러 배너 표시, 페이지는 정상 렌더링
            log.warn("[admin-embeddings] AI 서버 색인 상태 조회 실패: {}", e.getMessage());
        }

        model.addAttribute("status", status);           // null이면 화면에서 에러 배너 표시
        model.addAttribute("currentMenu", "embeddings");
        model.addAttribute("pageTitle", "임베딩 인덱스 관리");
        return "admin/embeddings";
    }

    /**
     * 전체 활성 문제를 Qdrant에 재색인한다.
     * 완료 후 임베딩 관리 페이지로 리다이렉트한다.
     */
    @PostMapping("/index-all")
    public String indexAll(RedirectAttributes redirectAttrs) {
        log.info("[admin-embeddings] 전체 재색인 시작");
        try {
            IndexQuestionsBulkResult result = questionGenerateService.reindexAll();
            redirectAttrs.addFlashAttribute("successMessage",
                    String.format("전체 색인 완료: %d개 성공, %d개 실패",
                            result.succeeded(), result.failed()));
            log.info("[admin-embeddings] 전체 재색인 완료: succeeded={}, failed={}",
                    result.succeeded(), result.failed());
        } catch (Exception e) {
            log.error("[admin-embeddings] 전체 재색인 오류: {}", e.getMessage());
            redirectAttrs.addFlashAttribute("errorMessage", "전체 색인 중 오류 발생: " + e.getMessage());
        }
        return "redirect:/admin/embeddings";
    }

    /**
     * 선택한 문제 UUID 목록을 Qdrant에 재색인한다.
     * questions.html의 체크박스 선택 후 "선택 색인" 버튼에서 호출된다.
     * JSON API — 응답은 { succeeded, failed } 형태로 반환한다.
     */
    @PostMapping("/index-selected")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> indexSelected(
            @RequestBody Map<String, List<String>> body) {
        List<String> uuids = body.get("uuids");
        if (uuids == null || uuids.isEmpty()) {
            log.warn("[admin-embeddings] 선택 색인 요청: UUID 목록 없음");
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "색인할 문제가 선택되지 않았습니다."));
        }

        log.info("[admin-embeddings] 선택 재색인 시작: count={}", uuids.size());
        try {
            IndexQuestionsBulkResult result = questionGenerateService.reindexSelected(uuids);
            log.info("[admin-embeddings] 선택 재색인 완료: succeeded={}, failed={}",
                    result.succeeded(), result.failed());
            return ResponseEntity.ok(Map.of(
                    "succeeded", result.succeeded(),
                    "failed", result.failed(),
                    "failedUuids", result.failedUuids()
            ));
        } catch (Exception e) {
            log.error("[admin-embeddings] 선택 재색인 오류: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
