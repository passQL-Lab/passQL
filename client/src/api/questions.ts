import { apiFetch } from "./client";
import { getMockResponse } from "./mock-data";
import { getMemberUuid } from "../stores/memberStore";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  TodayQuestionResponse,
  RecommendationsResponse,
} from "../types/api";

function isPracticeUuid(uuid: string): boolean {
  return uuid.startsWith("practice-");
}

async function fetchWithPracticeFallback<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    const mock = getMockResponse(path, options.method ?? "GET", options.body as string | undefined);
    if (mock !== null) return mock as T;
    throw new Error(`No mock fallback for ${path}`);
  }
}

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
  if (isPracticeUuid(questionUuid)) {
    return fetchWithPracticeFallback(`/questions/${questionUuid}`);
  }
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
  selectedChoiceKey: string,
): Promise<SubmitResult> {
  const options: RequestInit = {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ selectedChoiceKey }),
  };
  if (isPracticeUuid(questionUuid)) {
    return fetchWithPracticeFallback(`/questions/${questionUuid}/submit`, options);
  }
  return apiFetch(`/questions/${questionUuid}/submit`, options);
}

export function executeChoice(
  questionUuid: string,
  sql: string,
): Promise<ExecuteResult> {
  const options: RequestInit = {
    method: "POST",
    body: JSON.stringify({ sql }),
  };
  if (isPracticeUuid(questionUuid)) {
    return fetchWithPracticeFallback(`/questions/${questionUuid}/execute`, options);
  }
  return apiFetch(`/questions/${questionUuid}/execute`, options);
}
