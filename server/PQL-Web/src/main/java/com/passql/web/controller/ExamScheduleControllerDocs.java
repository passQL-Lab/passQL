package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.meta.dto.ExamScheduleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Tag(name = "ExamSchedule", description = "시험 일정 조회")
public interface ExamScheduleControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 23, description = "시험 일정 조회 API 신규 추가. certType 파라미터로 자격증 종류 필터링 가능"),
  })
  @Operation(
      summary = "시험 일정 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - **`certType`** (optional): 자격증 종류 필터 (SQLD / SQLP). 미입력 시 전체 조회

          ## 반환값 (List<ExamScheduleResponse>)
          - certType + round 오름차순 정렬
          - 각 행: examScheduleUuid, certType, round, examDate, isSelected
          """
  )
  ResponseEntity<List<ExamScheduleResponse>> getSchedules(
      @RequestParam(value = "certType", required = false) String certType);

  @ApiLogs({
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 23, description = "현재 선택된 시험 일정 조회 API 신규 추가. 선택된 일정이 없으면 200 + null 반환"),
  })
  @Operation(
      summary = "현재 선택된 시험 일정 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 반환값 (ExamScheduleResponse)
          - isSelected = true 인 단일 시험 일정
          - 선택된 일정이 없으면 200 OK + null body (홈화면 greeting fallback 처리)
          """
  )
  ResponseEntity<ExamScheduleResponse> getSelected();
}
