import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer } from "../api/questions";

export function useQuestionDetail(questionUuid: string) {
  return useQuery({
    queryKey: ["question", questionUuid],
    queryFn: () => fetchQuestion(questionUuid),
    // staleTime: 0이면 포커스 복귀·mount마다 background refetch 발생
    // SSE 진행 중(최대 60초) refetch로 인한 불필요한 네트워크 요청 방지
    staleTime: 60_000,
  });
}

export function useExecuteChoice(questionUuid: string) {
  return useMutation({
    mutationFn: (sql: string) => executeChoice(questionUuid, sql),
  });
}

export function useSubmitAnswer(questionUuid: string) {
  return useMutation({
    mutationFn: ({ choiceSetId, selectedChoiceKey }: { choiceSetId: string; selectedChoiceKey: string }) =>
      submitAnswer(questionUuid, choiceSetId, selectedChoiceKey),
  });
}
