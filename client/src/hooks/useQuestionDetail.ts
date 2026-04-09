import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer, generateChoices } from "../api/questions";
import type {
  ChoiceItem,
  ChoiceGenerationPhase,
  ChoiceGenerationError,
} from "../types/api";

export function useQuestionDetail(questionUuid: string) {
  return useQuery({
    queryKey: ["question", questionUuid],
    queryFn: () => fetchQuestion(questionUuid),
    staleTime: 0,
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

type GenerateState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading"; readonly phase: ChoiceGenerationPhase; readonly message: string }
  | { readonly kind: "done"; readonly choiceSetId: string; readonly choices: readonly ChoiceItem[] }
  | { readonly kind: "error"; readonly error: ChoiceGenerationError };

export function useGenerateChoices(questionUuid: string) {
  const [state, setState] = useState<GenerateState>({ kind: "idle" });
  const abortRef = useRef<(() => void) | null>(null);

  const generate = useCallback(() => {
    // Clean up previous stream
    abortRef.current?.();

    setState({ kind: "loading", phase: "generating", message: "선택지 생성 중..." });

    abortRef.current = generateChoices(questionUuid, {
      onStatus: ({ phase, message }) => {
        setState({ kind: "loading", phase, message });
      },
      onComplete: ({ choiceSetId, choices }) => {
        setState({ kind: "done", choiceSetId, choices });
        abortRef.current = null;
      },
      onError: (error) => {
        setState({ kind: "error", error });
        abortRef.current = null;
      },
    });
  }, [questionUuid]);

  // Auto-start on mount, cleanup on unmount
  useEffect(() => {
    generate();
    return () => {
      abortRef.current?.();
    };
  }, [generate]);

  return { state, retry: generate };
}
