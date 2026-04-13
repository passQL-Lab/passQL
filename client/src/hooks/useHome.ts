import { useQuery } from "@tanstack/react-query";
import { fetchGreeting } from "../api/home";
import { fetchTodayQuestion, fetchRecommendations } from "../api/questions";
import { fetchSelectedSchedule } from "../api/examSchedules";
import { fetchHeatmap } from "../api/progress";
import { useMemberStore } from "../stores/memberStore";

export function useGreeting() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    queryKey: ["greeting", uuid],
    queryFn: () => fetchGreeting(uuid),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useTodayQuestion() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    queryKey: ["todayQuestion", uuid],
    queryFn: () => fetchTodayQuestion(uuid),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useRecommendations() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    // uuid를 queryKey에 포함 — 로그인 상태 변경 시 자동 재조회
    queryKey: ["recommendations", uuid],
    queryFn: () => fetchRecommendations(3, undefined, uuid ?? undefined),
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
  const uuid = useMemberStore((s) => s.uuid);
  const now = new Date();
  const today = toLocalDateStr(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 29);
  const from = toLocalDateStr(fromDate);
  return useQuery({
    queryKey: ["heatmap", uuid, from, today],
    queryFn: () => fetchHeatmap(uuid, from, today),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
