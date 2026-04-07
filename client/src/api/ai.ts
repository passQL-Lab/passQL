import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { AiResult, SimilarQuestion, ExplainErrorPayload, DiffExplainPayload } from "../types/api";

export function explainError(payload: ExplainErrorPayload): Promise<AiResult> {
  return apiFetch("/ai/explain-error", {
    method: "POST",
    headers: { "X-User-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}

export function diffExplain(payload: DiffExplainPayload): Promise<AiResult> {
  return apiFetch("/ai/diff-explain", {
    method: "POST",
    headers: { "X-User-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}

export function fetchSimilar(questionId: number, k = 5): Promise<SimilarQuestion[]> {
  return apiFetch(`/ai/similar/${questionId}?k=${k}`);
}
