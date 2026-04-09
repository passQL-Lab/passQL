import { useQuery } from "@tanstack/react-query";
import { fetchProgress } from "../api/progress";

export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    staleTime: 0,
  });
}
