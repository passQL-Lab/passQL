import { apiFetch } from "./client";
import type { QuestionSummary, PracticeSubmitPayload, PracticeAnalysis } from "../types/api";

interface GenerateResponse {
  readonly sessionId: string;
  readonly questions: readonly QuestionSummary[];
}

export async function generatePractice(topicCode: string): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>("/practice/generate", {
    method: "POST",
    body: JSON.stringify({ topicCode }),
  });
}

export async function submitPractice(payload: PracticeSubmitPayload): Promise<PracticeAnalysis> {
  return apiFetch<PracticeAnalysis>("/practice/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
