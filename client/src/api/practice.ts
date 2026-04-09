import { apiFetch } from "./client";
import { getMockResponse } from "./mock-data";
import type { QuestionSummary, PracticeSubmitPayload, PracticeAnalysis } from "../types/api";

interface GenerateResponse {
  readonly sessionId: string;
  readonly questions: readonly QuestionSummary[];
}

async function practiceFetch<T>(path: string, options: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    // 백엔드에 practice 엔드포인트가 아직 없으면 mock fallback
    await new Promise((r) => setTimeout(r, 1500));
    const mock = getMockResponse(path, options.method ?? "POST", options.body as string | undefined);
    if (mock !== null) return mock as T;
    throw new Error(`No mock for ${path}`);
  }
}

export async function generatePractice(topicCode: string): Promise<GenerateResponse> {
  return practiceFetch<GenerateResponse>("/practice/generate", {
    method: "POST",
    body: JSON.stringify({ topicCode }),
  });
}

export async function submitPractice(payload: PracticeSubmitPayload): Promise<PracticeAnalysis> {
  return practiceFetch<PracticeAnalysis>("/practice/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
