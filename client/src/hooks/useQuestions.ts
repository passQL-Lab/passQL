import { useQuery } from "@tanstack/react-query";
import { fetchQuestions } from "../api/questions";

interface UseQuestionsParams {
  readonly page?: number;
  readonly size?: number;
  readonly topic?: string;
  readonly difficulty?: number;
  readonly enabled?: boolean;
}

export function useQuestions(params: UseQuestionsParams = {}) {
  const { enabled = true, ...fetchParams } = params;
  return useQuery({
    queryKey: ["questions", fetchParams],
    queryFn: () => fetchQuestions(fetchParams),
    staleTime: 1000 * 30,
    enabled,
  });
}
