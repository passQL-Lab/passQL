import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { ProgressSummary, HeatmapEntry } from "../types/api";

export function fetchProgress(): Promise<ProgressSummary> {
  const params = new URLSearchParams({ memberUuid: getMemberUuid() });
  return apiFetch(`/progress?${params}`);
}

export function fetchHeatmap(): Promise<HeatmapEntry[]> {
  return apiFetch("/progress/heatmap", {
    headers: { "X-User-UUID": getMemberUuid() },
  });
}
