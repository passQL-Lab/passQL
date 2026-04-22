import { useQuery } from "@tanstack/react-query";
import { fetchProgress } from "../api/progress";
import { useAuthStore } from "../stores/authStore";

export function useProgress() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["progress", accessToken],
    queryFn: fetchProgress,
    enabled: !!accessToken,
    staleTime: 0,
    retry: false,
  });
}
