import { useQuery } from "@tanstack/react-query";
import { fetchProgress } from "../api/progress";
import { useMemberStore } from "../stores/memberStore";

export function useProgress() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    // uuid를 queryKey에 포함 — 다른 훅들과 동일한 패턴, UUID 발급 전 호출 방지
    queryKey: ["progress", uuid],
    queryFn: fetchProgress,
    enabled: !!uuid,
    staleTime: 0,
    // 500 에러 시 즉시 isError 전환 (기본값 3회 재시도 방지)
    retry: false,
  });
}
