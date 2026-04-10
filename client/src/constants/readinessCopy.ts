import type { ToneKey } from "../types/api";

type ScoreBand = "low" | "mid" | "high";

function getScoreBand(score: number): ScoreBand {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "mid";
  return "low";
}

const COPY_MATRIX: Record<ToneKey, Record<ScoreBand, string>> = {
  NO_EXAM: {
    low: "시험 일정을 설정하면 맞춤 전략을 세울 수 있어요",
    mid: "꾸준히 하고 있네요. 시험 일정을 설정해보세요",
    high: "실력이 탄탄해요. 시험 도전해볼 때예요",
  },
  ONBOARDING: {
    low: "첫 걸음을 뗐어요. 하루 5문제부터 시작해봐요",
    mid: "좋은 출발이에요. 이 페이스 유지해봐요",
    high: "빠르게 적응하고 있어요",
  },
  POST_EXAM: {
    low: "다음 시험을 준비하면서 약한 영역을 보강해봐요",
    mid: "복습하면서 감을 유지하세요",
    high: "다음 시험도 충분히 합격할 수 있어요",
  },
  TODAY: {
    low: "오늘이 시험이에요. 긴장 풀고 실력 발휘하세요",
    mid: "충분히 준비했어요. 자신감을 가지세요",
    high: "합격 준비 완료. 실력대로만 하면 돼요",
  },
  SPRINT: {
    low: "시험이 코앞이에요. 오늘 10문제만 풀어봐요",
    mid: "막판 스퍼트! 약한 영역 집중 공략하세요",
    high: "시험 준비 거의 끝. 마지막 점검만 남았어요",
  },
  PUSH: {
    low: "2주 안에 시험이에요. 매일 조금씩 풀어봐요",
    mid: "잘 하고 있어요. 남은 기간 꾸준히 하면 돼요",
    high: "이 페이스면 합격 충분해요",
  },
  STEADY: {
    low: "아직 시간 있어요. 하루 한 문제씩 습관을 만들어봐요",
    mid: "안정적으로 준비하고 있어요",
    high: "벌써 이 정도면 여유 있게 준비할 수 있어요",
  },
  EARLY: {
    low: "일찍 시작했어요. 기초부터 탄탄히 쌓아가봐요",
    mid: "여유롭게 준비하고 있네요. 좋은 흐름이에요",
    high: "미리 준비하는 만큼 합격이 가까워져요",
  },
};

export function getReadinessCopy(toneKey: ToneKey, score: number): string {
  const band = getScoreBand(score);
  return COPY_MATRIX[toneKey][band];
}
