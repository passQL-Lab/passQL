import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { AiResult, SimilarQuestion } from "../types/api";

export function explainError(payload: Record<string, unknown>): Promise<AiResult> {
  return apiFetch("/ai/explain-error", {
    method: "POST",
    headers: { "X-User-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}

export function diffExplain(payload: Record<string, unknown>): Promise<AiResult> {
  return apiFetch("/ai/diff-explain", {
    method: "POST",
    headers: { "X-User-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}

export function fetchSimilar(questionId: number, k = 5): Promise<SimilarQuestion[]> {
  return apiFetch(`/ai/similar/${questionId}?k=${k}`);
}
