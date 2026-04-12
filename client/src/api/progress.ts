import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { ProgressResponse, HeatmapResponse, TopicAnalysisResponse, AiCommentResponse } from "../types/api";

export function fetchProgress(): Promise<ProgressResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress?memberUuid=${uuid}`);
}

export function fetchHeatmap(memberUuid: string, from?: string, to?: string): Promise<HeatmapResponse> {
  const query = new URLSearchParams();
  query.set("memberUuid", memberUuid);
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return apiFetch(`/progress/heatmap?${query}`);
}

// 토픽별 정답률/풀이 수 분석 (레이더·막대 차트용)
export function fetchTopicAnalysis(): Promise<TopicAnalysisResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/topic-analysis?memberUuid=${uuid}`);
}

// AI 영역 분석 코멘트
// sessionUuid 있으면 세션 단위 캐시 2h (결과 화면), 없으면 멤버 단위 캐시 (통계 화면)
export function fetchAiComment(sessionUuid?: string): Promise<AiCommentResponse> {
  const uuid = getMemberUuid();
  const query = sessionUuid ? `&sessionUuid=${sessionUuid}` : "";
  return apiFetch(`/progress/ai-comment?memberUuid=${uuid}${query}`);
}
