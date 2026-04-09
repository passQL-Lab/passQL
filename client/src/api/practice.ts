import { apiFetch } from "./client";
import { getMockResponse } from "./mock-data";
import { usePracticeStore } from "../stores/practiceStore";
import type { QuestionSummary, PracticeSubmitPayload, PracticeAnalysis } from "../types/api";

interface GenerateResponse {
  readonly sessionId: string;
  readonly questions: readonly QuestionSummary[];
}

async function practiceFetch<T>(path: string, options: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    await new Promise((r) => setTimeout(r, 1500));
    const mock = getMockResponse(path, options.method ?? "POST", options.body as string | undefined);
    if (mock !== null) return mock as T;
    throw new Error(`No mock for ${path}`);
  }
}

/**
 * 문제 생성 요청. 첫 문제만 즉시 반환하고,
 * 나머지는 백그라운드에서 점진적으로 store에 추가 (AI 생성 시뮬레이션).
 */
export async function generatePractice(topicCode: string): Promise<GenerateResponse> {
  const response = await practiceFetch<GenerateResponse>("/practice/generate", {
    method: "POST",
    body: JSON.stringify({ topicCode }),
  });

  const [first, ...rest] = response.questions;

  // 나머지 문제를 0~2초 랜덤 딜레이로 점진 추가
  rest.forEach((q, i) => {
    const delay = (i + 1) * (500 + Math.random() * 1500);
    setTimeout(() => {
      usePracticeStore.getState().addQuestion(q);
    }, delay);
  });

  return { sessionId: response.sessionId, questions: [first] };
}

export async function submitPractice(payload: PracticeSubmitPayload): Promise<PracticeAnalysis> {
  return practiceFetch<PracticeAnalysis>("/practice/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
