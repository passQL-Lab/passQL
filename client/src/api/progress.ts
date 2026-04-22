import { apiFetch } from "./client";
import type { ProgressResponse, HeatmapResponse, TopicAnalysisResponse, AiCommentResponse } from "../types/api";

export function fetchProgress(): Promise<ProgressResponse> {
  return apiFetch("/progress");
}

export function fetchHeatmap(from?: string, to?: string): Promise<HeatmapResponse> {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const qs = query.toString();
  return apiFetch(`/progress/heatmap${qs ? `?${qs}` : ""}`);
}

export function fetchTopicAnalysis(): Promise<TopicAnalysisResponse> {
  return apiFetch("/progress/topic-analysis");
}

// sessionUuid 있으면 세션 단위 캐시 2h (결과 화면), 없으면 멤버 단위 캐시 (통계 화면)
export function fetchAiComment(sessionUuid?: string): Promise<AiCommentResponse> {
  const qs = sessionUuid ? `?sessionUuid=${sessionUuid}` : "";
  return apiFetch(`/progress/ai-comment${qs}`);
}
