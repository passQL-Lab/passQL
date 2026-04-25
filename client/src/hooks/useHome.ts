import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const RECOMMENDATIONS_KEY = (accessToken: string | null) =>
  ["recommendations", accessToken] as const;

export function useRecommendations() {
  const accessToken = useAuthStore((s) => s.accessToken);
  // excludeUuids를 queryKey에 포함하면 seenUuids 변경마다 캐시 키가 달라져 무한 재요청 발생
  // → queryKey는 고정, excludeUuids는 useRefreshRecommendations에서 명시적 갱신 시에만 전달
  return useQuery({
    queryKey: RECOMMENDATIONS_KEY(accessToken),
    queryFn: () => fetchRecommendations(3, []),
    // 미인증 상태에서 호출 방지 — null 키 캐시 엔트리 생성 방지
    enabled: !!accessToken,
    staleTime: Infinity,
    retry: false,
  });
}

/**
 * 새로고침 버튼 클릭 시 seenUuids를 제외 목록으로 전달하여 캐시를 갱신하는 훅
 * useRecommendations의 queryKey는 고정이므로 setQueryData로 덮어쓴다
 */
export function useRefreshRecommendations() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  // accessToken·queryClient 변경 시에만 새 함수 참조 생성 — Home의 handleRefresh useCallback 안정화
  return useCallback(async (excludeUuids: string[]) => {
    const data = await fetchRecommendations(3, excludeUuids);
    queryClient.setQueryData(RECOMMENDATIONS_KEY(accessToken), data);
  }, [accessToken, queryClient]);
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
