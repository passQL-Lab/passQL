import { useQuery } from "@tanstack/react-query";
import { fetchTopics } from "../api/meta";

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: fetchTopics,
    staleTime: Infinity,
  });
}
