import { create } from "zustand";
import type { QuestionSummary } from "../types/api";

interface DailySetQuestionResult {
  readonly questionUuid: string;
  readonly isCorrect: boolean;
  readonly selectedChoiceKey: string;
  readonly selectedChoiceBody: string;
  readonly durationMs: number;
  readonly submissionUuid?: string;
  readonly choiceSetUuid?: string;
}

interface DailySetState {
  readonly sessionUuid: string | null;
  readonly questions: readonly QuestionSummary[];
  readonly currentIndex: number;
  readonly results: readonly DailySetQuestionResult[];
  // 세션 시작 또는 문제 이동 시각 — 문제별 소요 시간 계산에 사용
  readonly startedAt: number | null;
  readonly correctCount: number | null;
}

interface DailySetActions {
  readonly startSession: (sessionUuid: string, questions: readonly QuestionSummary[]) => void;
  readonly submitAndAdvance: (
    questionUuid: string,
    isCorrect: boolean,
    selectedChoiceKey: string,
    selectedChoiceBody: string,
    submissionUuid?: string,
    choiceSetUuid?: string,
  ) => void;
  readonly setCorrectCount: (count: number) => void;
  readonly reset: () => void;
}

const INITIAL_STATE: DailySetState = {
  sessionUuid: null,
  questions: [],
  currentIndex: 0,
  results: [],
  startedAt: null,
  correctCount: null,
};

export const useDailySetStore = create<DailySetState & DailySetActions>()((set, get) => ({
  ...INITIAL_STATE,

  startSession: (sessionUuid, questions) =>
    set({ ...INITIAL_STATE, sessionUuid, questions, startedAt: Date.now() }),

  submitAndAdvance: (questionUuid, isCorrect, selectedChoiceKey, selectedChoiceBody, submissionUuid, choiceSetUuid) => {
    const { startedAt } = get();
    // startedAt이 null이면 소요 시간을 0으로 처리
    const durationMs = startedAt ? Date.now() - startedAt : 0;
    const newResult: DailySetQuestionResult = {
      questionUuid, isCorrect, selectedChoiceKey, selectedChoiceBody, durationMs, submissionUuid, choiceSetUuid,
    };
    set((s) => ({
      results: [...s.results, newResult],
      currentIndex: s.currentIndex + 1,
      // 다음 문제 소요 시간 측정을 위해 타이머 리셋
      startedAt: Date.now(),
    }));
  },

  setCorrectCount: (count) => set({ correctCount: count }),

  reset: () => set(INITIAL_STATE),
}));
