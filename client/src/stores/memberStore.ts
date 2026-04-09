import { create } from "zustand";
import { register } from "../api/members";

const STORAGE_KEY = "passql_member_uuid";
const NICKNAME_KEY = "passql_nickname";

interface MemberState {
  readonly uuid: string;
  readonly nickname: string;
  readonly isRegistering: boolean;
  readonly setNickname: (nickname: string) => void;
}

function getStoredUuid(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getStoredNickname(): string {
  return localStorage.getItem(NICKNAME_KEY) ?? "";
}

export const useMemberStore = create<MemberState>()((set) => ({
  uuid: getStoredUuid() ?? "",
  nickname: getStoredNickname(),
  isRegistering: false,
  setNickname: (nickname: string) => {
    localStorage.setItem(NICKNAME_KEY, nickname);
    set({ nickname });
  },
}));

export function getMemberUuid(): string {
  return useMemberStore.getState().uuid;
}

export async function ensureRegistered(): Promise<void> {
  const { uuid } = useMemberStore.getState();
  if (uuid) return;

  useMemberStore.setState({ isRegistering: true });
  try {
    const result = await register();
    localStorage.setItem(STORAGE_KEY, result.memberUuid);
    localStorage.setItem(NICKNAME_KEY, result.nickname);
    useMemberStore.setState({
      uuid: result.memberUuid,
      nickname: result.nickname,
      isRegistering: false,
    });
  } catch {
    const fallbackUuid = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, fallbackUuid);
    useMemberStore.setState({
      uuid: fallbackUuid,
      isRegistering: false,
    });
  }
}
