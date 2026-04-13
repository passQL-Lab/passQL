const EXECUTABLE_GRADING_MESSAGES: readonly string[] = [
  "쿼리를 직접 실행해보는 중이에요",
  "SQL을 실제로 돌려보는 중이에요",
  "결과를 직접 확인해보는 중이에요",
  "DB에 쿼리를 날려보는 중이에요",
  "실행 결과로 정답을 가리는 중이에요",
];

export function getRandomExecutableGradingMessage(): string {
  const idx = Math.floor(Math.random() * EXECUTABLE_GRADING_MESSAGES.length);
  return EXECUTABLE_GRADING_MESSAGES[idx];
}

const LOADING_MESSAGES: readonly string[] = [
  "AI가 머리를 굴리는 중...",
  "SQL 요정이 문제를 짓는 중...",
  "데이터베이스 세계에서 퀴즈를 가져오는 중...",
  "SELECT 난이도 FROM 적당한곳...",
  "뇌세포를 자극할 문제를 고르는 중...",
  "{topic} 마스터로 가는 길을 닦는 중...",
];

export function getRandomMessage(topicName: string): string {
  const idx = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[idx].replace("{topic}", topicName);
}
