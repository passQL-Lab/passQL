import { useQuery } from "@tanstack/react-query";
import { fetchProgress } from "../api/progress";

export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    staleTime: 0,
    // 500 에러 시 즉시 isError 전환 (기본값 3회 재시도 방지)
    retry: false,
  });
}
