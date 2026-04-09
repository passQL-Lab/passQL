import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { ProgressResponse, HeatmapResponse } from "../types/api";

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
