import { useAuthStore } from "./authStore";

/** 하위 호환: authStore에서 memberUuid를 가져오는 래퍼 */
export function getMemberUuid(): string {
  return useAuthStore.getState().memberUuid ?? "";
}

/** 하위 호환: authStore에서 nickname을 가져오는 Zustand selector */
export function useMemberStore<T>(selector: (s: { uuid: string; nickname: string }) => T): T {
  return useAuthStore((auth) =>
    selector({
      uuid: auth.memberUuid ?? "",
      nickname: auth.nickname ?? "",
    })
  );
}
