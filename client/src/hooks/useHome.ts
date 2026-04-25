import { useQuery } from "@tanstack/react-query";
import { fetchGreeting } from "../api/home";
import { fetchTodayQuestion, fetchRecommendations } from "../api/questions";
import { fetchSelectedSchedule } from "../api/examSchedules";
import { fetchHeatmap } from "../api/progress";
import { useAuthStore } from "../stores/authStore";

export function useGreeting() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["greeting", accessToken],
    queryFn: fetchGreeting,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useTodayQuestion() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["todayQuestion", accessToken],
    queryFn: fetchTodayQuestion,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useRecommendations(excludeUuids: string[] = []) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    // excludeUuids가 바뀌면 새 요청 트리거 — 세션 내 중복 제외 핵심
    queryKey: ["recommendations", accessToken, excludeUuids],
    queryFn: () => fetchRecommendations(3, excludeUuids),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useSelectedSchedule() {
  return useQuery({
    queryKey: ["selectedSchedule"],
    queryFn: fetchSelectedSchedule,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}

/** 로컬 타임존 기준 YYYY-MM-DD 반환 — toISOString()은 UTC 기준이라 KST에서 날짜 밀림 발생 */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useHeatmap() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const now = new Date();
  const today = toLocalDateStr(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 29);
  const from = toLocalDateStr(fromDate);
  return useQuery({
    queryKey: ["heatmap", accessToken, from, today],
    queryFn: () => fetchHeatmap(from, today),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
