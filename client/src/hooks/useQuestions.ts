import { useQuery } from "@tanstack/react-query";
import { fetchQuestions } from "../api/questions";

interface UseQuestionsParams {
  readonly page?: number;
  readonly size?: number;
  readonly topic?: string;
  readonly difficulty?: number;
}

export function useQuestions(params: UseQuestionsParams = {}) {
  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => fetchQuestions(params),
    staleTime: 1000 * 30,
  });
}
