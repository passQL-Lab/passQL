import { apiFetch } from "./client";
import { generateChoicesMock } from "./mock-data";
import { getMemberUuid } from "../stores/memberStore";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  TodayQuestionResponse,
  RecommendationsResponse,
  ChoiceGenerationStatus,
  ChoiceSetComplete,
  ChoiceGenerationError,
} from "../types/api";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

interface QuestionListParams {
  readonly page?: number;
  readonly size?: number;
  readonly topic?: string;
  readonly subtopic?: string;
  readonly difficulty?: number;
  readonly mode?: string;
}

export function fetchQuestions(
  params: QuestionListParams = {},
): Promise<Page<QuestionSummary>> {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.size != null) query.set("size", String(params.size));
  if (params.topic) query.set("topic", params.topic);
  if (params.subtopic) query.set("subtopic", params.subtopic);
  if (params.difficulty != null)
    query.set("difficulty", String(params.difficulty));
  if (params.mode) query.set("mode", params.mode);

  return apiFetch(`/questions?${query}`);
}

export function fetchQuestion(questionUuid: string): Promise<QuestionDetail> {
  return apiFetch(`/questions/${questionUuid}`);
}

export function fetchTodayQuestion(memberUuid?: string): Promise<TodayQuestionResponse> {
  const query = new URLSearchParams();
  if (memberUuid) query.set("memberUuid", memberUuid);
  const qs = query.toString();
  return apiFetch(`/questions/today${qs ? `?${qs}` : ""}`);
}

export function fetchRecommendations(
  size?: number,
  excludeQuestionUuid?: string,
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (size != null) query.set("size", String(size));
  if (excludeQuestionUuid) query.set("excludeQuestionUuid", excludeQuestionUuid);
  const qs = query.toString();
  return apiFetch(`/questions/recommendations${qs ? `?${qs}` : ""}`);
}

export function submitAnswer(
  questionUuid: string,
  choiceSetId: string,
  selectedChoiceKey: string,
): Promise<SubmitResult> {
  return apiFetch(`/questions/${questionUuid}/submit`, {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ choiceSetId, selectedChoiceKey }),
  });
}

interface ChoiceGenerationCallbacks {
  readonly onStatus: (status: ChoiceGenerationStatus) => void;
  readonly onComplete: (result: ChoiceSetComplete) => void;
  readonly onError: (error: ChoiceGenerationError) => void;
}

/**
 * POST /questions/{questionUuid}/generate-choices (SSE)
 * Returns a cleanup function — call it to abort the stream.
 */
export function generateChoices(
  questionUuid: string,
  callbacks: ChoiceGenerationCallbacks,
): () => void {
  if (USE_MOCK) {
    return generateChoicesMock(questionUuid, callbacks);
  }

  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/questions/${questionUuid}/generate-choices`,
        {
          method: "POST",
          headers: {
            "X-Member-UUID": getMemberUuid(),
            Accept: "text/event-stream",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        },
      );

      if (!res.ok || !res.body) {
        callbacks.onError({
          code: "HTTP_ERROR",
          message: `서버 오류 (${res.status})`,
          retryable: true,
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE blocks are separated by "\n\n"
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const lines = block.split("\n");
          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
          }

          if (!eventType || !dataStr) continue;

          const data = JSON.parse(dataStr) as unknown;

          if (eventType === "status") {
            callbacks.onStatus(data as ChoiceGenerationStatus);
          } else if (eventType === "complete") {
            callbacks.onComplete(data as ChoiceSetComplete);
          } else if (eventType === "error") {
            callbacks.onError(data as ChoiceGenerationError);
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      callbacks.onError({
        code: "NETWORK_ERROR",
        message: "네트워크 오류가 발생했습니다",
        retryable: true,
      });
    }
  })();

  return () => controller.abort();
}

export function executeChoice(
  questionUuid: string,
  sql: string,
): Promise<ExecuteResult> {
  return apiFetch(`/questions/${questionUuid}/execute`, {
    method: "POST",
    body: JSON.stringify({ sql }),
  });
}
