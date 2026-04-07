import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer } from "../api/questions";

export function useQuestionDetail(id: number) {
  return useQuery({
    queryKey: ["question", id],
    queryFn: () => fetchQuestion(id),
    staleTime: 0,
  });
}

export function useExecuteChoice(questionId: number) {
  return useMutation({
    mutationFn: (sql: string) => executeChoice(questionId, sql),
  });
}

export function useSubmitAnswer(questionId: number) {
  return useMutation({
    mutationFn: (selectedKey: string) => submitAnswer(questionId, selectedKey),
  });
}
