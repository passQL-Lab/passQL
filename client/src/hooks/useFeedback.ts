import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyFeedback, submitFeedback } from "../api/feedback";
import { ApiError } from "../api/client";
import type { FeedbackListResponse } from "../types/api";

// API 미구현(404) 시 빈 배열로 graceful fallback
const EMPTY_LIST: FeedbackListResponse = { items: [] };

/**
 * 내 건의사항 목록 쿼리
 * - API 미구현(404) → EMPTY_LIST fallback (섹션 유지, 빈 상태 표시)
 * - 그 외 에러 → throw (ErrorFallback 렌더링)
 */
export function useMyFeedback() {
  return useQuery({
    queryKey: ["feedback", "my"],
    queryFn: async () => {
      try {
        return await fetchMyFeedback();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return EMPTY_LIST;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2, // 2분
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
