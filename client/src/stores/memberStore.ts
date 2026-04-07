import { create } from "zustand";

const STORAGE_KEY = "passql_member_uuid";

function getOrCreateUuid(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const uuid = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, uuid);
  return uuid;
}

interface MemberState {
  readonly uuid: string;
}

export const useMemberStore = create<MemberState>()(() => ({
  uuid: getOrCreateUuid(),
}));

export function getMemberUuid(): string {
  return useMemberStore.getState().uuid;
}
