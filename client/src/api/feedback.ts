import { apiFetch } from "./client";
import type { FeedbackListResponse, FeedbackSubmitResponse } from "../types/api";

export async function submitFeedback(content: string): Promise<FeedbackSubmitResponse> {
  return apiFetch<FeedbackSubmitResponse>("/feedback", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function fetchMyFeedback(): Promise<FeedbackListResponse> {
  return apiFetch<FeedbackListResponse>("/feedback/me");
}
