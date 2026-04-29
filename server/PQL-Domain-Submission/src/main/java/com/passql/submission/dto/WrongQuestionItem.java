package com.passql.submission.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 마이페이지 오답 노트 항목.
 * stem은 마크다운 제거 후 앞 50자만 내려줌 — 목록 표시용 미리보기.
 */
public record WrongQuestionItem(
    UUID questionUuid,
    String stemPreview,
    String topicName,
    LocalDateTime lastWrongAt
) {}
