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
