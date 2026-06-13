import { apiFetch } from "./client";
import type {
  DailySetTodayResponse,
  DailySetCompleteResponse,
  LeaderboardResponse,
} from "../types/api";

export function fetchDailySet(): Promise<DailySetTodayResponse> {
  return apiFetch("/daily-set/today");
}

export function completeDailySet(
  correctCount: number,
  sessionUuid: string,
): Promise<DailySetCompleteResponse> {
  return apiFetch("/daily-set/complete", {
    method: "POST",
    body: JSON.stringify({ correctCount, sessionUuid }),
  });
}

export function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return apiFetch("/daily-set/leaderboard");
}
