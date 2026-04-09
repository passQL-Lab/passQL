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
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => fetchRecommendations(3),
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

export function useHeatmap() {
  const uuid = useMemberStore((s) => s.uuid);
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["heatmap", uuid, from, today],
    queryFn: () => fetchHeatmap(uuid, from, today),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
