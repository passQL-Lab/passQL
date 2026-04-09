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
  readonly startTimer: () => void;
  readonly recordResult: (questionUuid: string, isCorrect: boolean, selectedChoiceKey: string) => void;
  readonly nextQuestion: () => void;
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
    set({ ...INITIAL_STATE, sessionId, topicCode, topicName, questions }),

  startTimer: () => set({ startedAt: Date.now() }),

  recordResult: (questionUuid, isCorrect, selectedChoiceKey) => {
    const { startedAt, results } = get();
    const completedAt = Date.now();
    const durationMs = startedAt ? completedAt - startedAt : 0;
    const newResult: PracticeQuestionResult = { questionUuid, isCorrect, selectedChoiceKey, durationMs };
    set({ results: [...results, newResult], startedAt: null });
  },

  nextQuestion: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),

  reset: () => set(INITIAL_STATE),
}));
