import { fetchQuestions } from "./questions";
import type { QuestionSummary } from "../types/api";

interface GenerateResponse {
  readonly sessionId: string;
  readonly questions: readonly QuestionSummary[];
}

export async function generatePractice(topicCode: string): Promise<GenerateResponse> {
  const page = await fetchQuestions({ topic: topicCode, size: 10 });
  if (page.content.length === 0) {
    throw new Error("해당 카테고리에 풀 수 있는 문제가 없어요.");
  }
  return {
    sessionId: `session-${Date.now()}`,
    questions: page.content,
  };
}
