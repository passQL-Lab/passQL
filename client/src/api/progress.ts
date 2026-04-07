import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { ProgressSummary, HeatmapEntry } from "../types/api";

export function fetchProgress(): Promise<ProgressSummary> {
  return apiFetch("/progress", {
    headers: { "X-User-UUID": getMemberUuid() },
  });
}

export function fetchHeatmap(): Promise<HeatmapEntry[]> {
  return apiFetch("/progress/heatmap", {
    headers: { "X-User-UUID": getMemberUuid() },
  });
}
