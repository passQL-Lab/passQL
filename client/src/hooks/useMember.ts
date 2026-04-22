import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, regenerateNickname } from "../api/members";
import { useAuthStore } from "../stores/authStore";

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
