import { useQuery } from "@tanstack/react-query";
import { fetchProgress, fetchHeatmap } from "../api/progress";

export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    staleTime: 0,
  });
}

export function useHeatmap() {
  return useQuery({
    queryKey: ["heatmap"],
    queryFn: fetchHeatmap,
    staleTime: 1000 * 60 * 5,
  });
}
