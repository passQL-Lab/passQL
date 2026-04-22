import { apiFetch } from "./client";
import type { AiResult, SimilarQuestion, ExplainErrorPayload, DiffExplainPayload } from "../types/api";

export function explainError(payload: ExplainErrorPayload): Promise<AiResult> {
  return apiFetch("/ai/explain-error", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function diffExplain(payload: DiffExplainPayload): Promise<AiResult> {
  return apiFetch("/ai/diff-explain", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchSimilar(questionUuid: string, k = 5): Promise<SimilarQuestion[]> {
  return apiFetch(`/ai/similar/${questionUuid}?k=${k}`);
}
