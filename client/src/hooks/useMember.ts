import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, regenerateNickname } from "../api/members";
import { useMemberStore } from "../stores/memberStore";

export function useMember() {
  const uuid = useMemberStore((s) => s.uuid);
  const setNickname = useMemberStore((s) => s.setNickname);

  const query = useQuery({
    queryKey: ["member", uuid],
    queryFn: fetchMe,
    enabled: !!uuid,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  if (query.data?.nickname && query.data.nickname !== useMemberStore.getState().nickname) {
    setNickname(query.data.nickname);
  }

  return query;
}

export function useRegenerateNickname() {
  const queryClient = useQueryClient();
  const setNickname = useMemberStore((s) => s.setNickname);

  return useMutation({
    mutationFn: regenerateNickname,
    onSuccess: (result) => {
      setNickname(result.nickname);
      queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}
