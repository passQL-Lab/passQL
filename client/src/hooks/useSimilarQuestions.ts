import { useQuery } from "@tanstack/react-query";
import { fetchSimilar } from "../api/ai";

export function useSimilarQuestions(questionUuid: string, k = 3) {
  return useQuery({
    queryKey: ["similarQuestions", questionUuid, k],
    queryFn: () => fetchSimilar(questionUuid, k),
    enabled: !!questionUuid,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}
