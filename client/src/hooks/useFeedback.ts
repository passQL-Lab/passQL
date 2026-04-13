import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyFeedback, submitFeedback } from "../api/feedback";

/**
 * 내 건의사항 목록 쿼리
 * - 빈 목록: 200 + { items: [] } (API 스펙 보장 — 404 없음)
 * - 에러 → throw (ErrorFallback 렌더링)
 */
export function useMyFeedback() {
  return useQuery({
    queryKey: ["feedback", "my"],
    queryFn: fetchMyFeedback,
    staleTime: 0, // 페이지 진입 시마다 최신 상태 반영 (PENDING→REVIEWED→APPLIED 변화 감지)
    retry: false,
  });
}

/**
 * 건의사항 제출 mutation
 * - 성공 시 목록 캐시 무효화 → 자동 refetch
 */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", "my"] });
    },
  });
}
