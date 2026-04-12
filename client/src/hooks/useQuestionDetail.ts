import { useRef } from "react";
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

export function useSubmitAnswer(questionUuid: string, sessionUuid?: string) {
  // sessionUuid 미전달(단독 풀이 모드) 시 폴백 UUID — ref로 마운트 시 1회 생성 후 고정
  // useMemo는 의존성 배열 관리 복잡도가 높아 ref 패턴 사용
  const fallbackSessionUuidRef = useRef(crypto.randomUUID());

  return useMutation({
    mutationFn: ({ choiceSetId, selectedChoiceKey }: { choiceSetId: string; selectedChoiceKey: string }) =>
      submitAnswer(questionUuid, choiceSetId, selectedChoiceKey, sessionUuid ?? fallbackSessionUuidRef.current),
  });
}
