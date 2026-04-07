import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
} from "../types/api";

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

export function fetchQuestion(id: number): Promise<QuestionDetail> {
  return apiFetch(`/questions/${id}`);
}

export function submitAnswer(
  id: number,
  selectedKey: string,
): Promise<SubmitResult> {
  return apiFetch(`/questions/${id}/submit`, {
    method: "POST",
    headers: { "X-User-UUID": getMemberUuid() },
    body: JSON.stringify({ selectedKey }),
  });
}

export function executeChoice(
  id: number,
  choiceKey: string,
): Promise<ExecuteResult> {
  return apiFetch(`/questions/${id}/execute`, {
    method: "POST",
    body: JSON.stringify({ choiceKey }),
  });
}
