import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { FeedbackListResponse, FeedbackSubmitResponse } from "../types/api";

/**
 * POST /feedback
 * 건의사항 제출 — body: { content }, 헤더: X-Member-UUID
 */
export async function submitFeedback(content: string): Promise<FeedbackSubmitResponse> {
  return apiFetch<FeedbackSubmitResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify({ content }),
    headers: { "X-Member-UUID": getMemberUuid() },
  });
}

/**
 * GET /feedback/me
 * 내 건의사항 목록 조회 — 헤더: X-Member-UUID
 */
export async function fetchMyFeedback(): Promise<FeedbackListResponse> {
  return apiFetch<FeedbackListResponse>("/feedback/me", {
    headers: { "X-Member-UUID": getMemberUuid() },
  });
}
