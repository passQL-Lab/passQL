import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, regenerateNickname, checkNickname, changeNickname, updateChoiceGenerationMode } from "../api/members";
import { useAuthStore } from "../stores/authStore";
import type { NicknameCheckResponse, NicknameChangeResponse, ChoiceGenerationMode } from "../types/api";

export function useMember() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setNickname = useAuthStore((s) => s.setNickname);

  const query = useQuery({
    queryKey: ["member", accessToken],
    queryFn: fetchMe,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  if (query.data?.nickname && query.data.nickname !== useAuthStore.getState().nickname) {
    setNickname(query.data.nickname);
  }

  return query;
}

export function useRegenerateNickname() {
  const queryClient = useQueryClient();
  const setNickname = useAuthStore((s) => s.setNickname);

  return useMutation({
    mutationFn: regenerateNickname,
    onSuccess: (result) => {
      setNickname(result.nickname);
      queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}

// 닉네임 중복 확인 뮤테이션 — 호출 시마다 서버에 요청
export function useCheckNickname() {
  return useMutation<NicknameCheckResponse, Error, string>({
    mutationFn: (nickname: string) => checkNickname(nickname),
  });
}

// 닉네임 변경 뮤테이션 — 성공 시 스토어 동기화 및 쿼리 무효화
export function useChangeNickname() {
  const queryClient = useQueryClient();
  const setNickname = useAuthStore((s) => s.setNickname);

  return useMutation<NicknameChangeResponse, Error, string>({
    mutationFn: (nickname: string) => changeNickname(nickname),
    onSuccess: (result) => {
      setNickname(result.nickname);
      queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}

// 선택지 생성 모드 변경 뮤테이션 — 성공 시 member 쿼리 무효화
export function useUpdateChoiceGenerationMode() {
  const queryClient = useQueryClient();

  return useMutation<
    { choiceGenerationMode: ChoiceGenerationMode },
    Error,
    ChoiceGenerationMode
  >({
    mutationFn: (mode: ChoiceGenerationMode) => updateChoiceGenerationMode(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}
