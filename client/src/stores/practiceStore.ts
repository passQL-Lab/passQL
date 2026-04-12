import { create } from "zustand";
import type { QuestionSummary, PracticeQuestionResult } from "../types/api";

interface PracticeState {
  readonly sessionId: string | null;
  readonly topicCode: string | null;
  readonly topicName: string | null;
  readonly questions: readonly QuestionSummary[];
  readonly currentIndex: number;
  readonly results: readonly PracticeQuestionResult[];
  readonly startedAt: number | null;
}

interface PracticeActions {
  readonly startSession: (sessionId: string, topicCode: string, topicName: string, questions: readonly QuestionSummary[]) => void;
  readonly addQuestion: (question: QuestionSummary) => void;
  readonly startTimer: () => void;
  readonly submitAndAdvance: (questionUuid: string, isCorrect: boolean, selectedChoiceKey: string, selectedChoiceBody: string) => void;
  // 다시 풀기로 정답 맞춘 경우 — 해당 문제 결과를 정답으로 갱신
  readonly markCorrect: (questionUuid: string) => void;
  readonly reset: () => void;
}

const INITIAL_STATE: PracticeState = {
  sessionId: null,
  topicCode: null,
  topicName: null,
  questions: [],
  currentIndex: 0,
  results: [],
  startedAt: null,
};

export const usePracticeStore = create<PracticeState & PracticeActions>()((set, get) => ({
  ...INITIAL_STATE,

  startSession: (sessionId, topicCode, topicName, questions) =>
    set({ ...INITIAL_STATE, sessionId, topicCode, topicName, questions, startedAt: Date.now() }),

  addQuestion: (question) => set((s) => ({ questions: [...s.questions, question] })),

  startTimer: () => set({ startedAt: Date.now() }),

  submitAndAdvance: (questionUuid, isCorrect, selectedChoiceKey, selectedChoiceBody) => {
    const { startedAt, results } = get();
    const durationMs = startedAt ? Date.now() - startedAt : 0;
    const newResult: PracticeQuestionResult = { questionUuid, isCorrect, selectedChoiceKey, selectedChoiceBody, durationMs };
    set((s) => ({
      results: [...results, newResult],
      currentIndex: s.currentIndex + 1,
      startedAt: Date.now(),
    }));
  },

  markCorrect: (questionUuid) =>
    set((s) => ({
      results: s.results.map((r) =>
        r.questionUuid === questionUuid ? { ...r, isCorrect: true } : r,
      ),
    })),

  reset: () => set(INITIAL_STATE),
}));
