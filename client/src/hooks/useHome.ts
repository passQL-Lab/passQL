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
  // 배열을 직렬화해야 React Query가 내용 기준으로 캐시 키를 비교함
  // 배열 참조를 그대로 넣으면 렌더마다 새 참조 → 무한 재요청 발생
  const excludeKey = JSON.stringify(excludeUuids);
  return useQuery({
    queryKey: ["recommendations", accessToken, excludeKey],
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
