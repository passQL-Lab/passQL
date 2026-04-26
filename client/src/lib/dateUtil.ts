/**
 * 닉네임 쿨다운 만료 시각 계산.
 *
 * 백엔드 쿨다운 기준은 "변경 시각 + 3일"이지만,
 * UX상 "이틀 뒤 자정"으로 표현한다 (오늘 6시 변경 → D+2 00:00 해제).
 * 즉, 변경일 기준으로 +2일 후 당일 자정(00:00)을 만료 시각으로 사용한다.
 */
export function getNicknameCooldownExpiry(nicknameChangedAt: string): Date {
  const changedDate = new Date(nicknameChangedAt);
  // 변경일 자정(00:00)으로 내림 후 +2일
  const expiry = new Date(
    changedDate.getFullYear(),
    changedDate.getMonth(),
    changedDate.getDate() + 2,
    0, 0, 0, 0
  );
  return expiry;
}

/** 쿨다운 중인지 여부 */
export function isNicknameCooldown(nicknameChangedAt: string | null | undefined): boolean {
  if (!nicknameChangedAt) return false;
  return new Date() < getNicknameCooldownExpiry(nicknameChangedAt);
}

/**
 * 쿨다운 만료까지 남은 시간을 한국어로 포맷.
 * 예: "내일 자정에 변경 가능해요" / "2일 후 자정에 변경 가능해요"
 */
export function formatNicknameCooldownMessage(nicknameChangedAt: string): string {
  const expiry = getNicknameCooldownExpiry(nicknameChangedAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return "내일 자정에 변경할 수 있어요";
  return `${diffDays}일 후 자정에 변경할 수 있어요`;
}
