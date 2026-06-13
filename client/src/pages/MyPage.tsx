import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Settings, Pencil, XCircle, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useStagger } from "../hooks/useStagger";
import { useMember } from "../hooks/useMember";
import { isNicknameCooldown, formatNicknameCooldownMessage } from "../lib/dateUtil";
import { fetchWrongQuestions } from "../api/progress";
import NicknameChangeModal from "../components/NicknameChangeModal";
import ErrorFallback from "../components/ErrorFallback";
import type { WrongQuestionItem } from "../types/api";

// 틀린 문제 카드 한 줄
function WrongQuestionRow({ item }: { readonly item: WrongQuestionItem }) {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate(`/questions/${item.questionUuid}`);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <div className="w-9 h-9 rounded-[10px] bg-sem-error-light flex items-center justify-center shrink-0">
        <XCircle size={18} className="text-sem-error" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{item.stemPreview}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* 토픽 뱃지 */}
          <span className="text-[10px] font-medium bg-accent-light text-brand px-1.5 py-0.5 rounded">
            {item.topicName}
          </span>
          <span className="text-[11px] text-text-caption">
            {formatRelativeTime(item.lastWrongAt)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        className="btn btn-primary btn-sm text-xs px-3 shrink-0"
      >
        다시 풀기
      </button>
    </div>
  );
}

// 오답 시각을 "N일 전" 형태로 변환
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  return `${days}일 전`;
}

export default function MyPage() {
  const navigate = useNavigate();
  const uuid = useAuthStore((s) => s.memberUuid ?? "");
  const nickname = useAuthStore((s) => s.nickname ?? "");
  const { data: memberData } = useMember();
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const stagger = useStagger();
  const s0 = stagger(0);
  const s1 = stagger(1);
  const s2 = stagger(2);

  const {
    data: wrongData,
    isLoading: wrongLoading,
    isError: wrongError,
    refetch: refetchWrong,
  } = useQuery({
    queryKey: ["wrongQuestions", uuid],
    queryFn: () => fetchWrongQuestions(5),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleNicknameEditClick = () => {
    const changedAt = memberData?.nicknameChangedAt ?? null;
    if (isNicknameCooldown(changedAt)) {
      showToast(formatNicknameCooldownMessage(changedAt!));
      return;
    }
    setIsNicknameModalOpen(true);
  };

  // 닉네임 첫 글자로 아바타 이니셜 생성
  const avatarLetter = (nickname || uuid.slice(0, 1)).slice(0, 1).toUpperCase();

  const wrongItems = wrongData?.items ?? [];
  const totalWrongCount = wrongData?.totalCount ?? 0;

  return (
    <div className="py-6 space-y-6">
      {/* 헤더 */}
      <section className={`flex items-center justify-between ${s0.className}`}>
        <h1 className="text-h1">마이페이지</h1>
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="w-9 h-9 bg-surface-card border border-border rounded-[10px] flex items-center justify-center hover:bg-surface transition-colors"
          aria-label="설정"
        >
          <Settings size={18} className="text-text-caption" />
        </button>
      </section>

      {/* 프로필 카드 */}
      <section className={`bg-surface-card border border-border rounded-2xl p-5 flex items-center gap-4 ${s1.className}`}>
        {/* 아바타 */}
        <div className="w-14 h-14 rounded-[14px] bg-brand flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-white">{avatarLetter}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-text-primary truncate">
            {nickname || uuid.slice(0, 8)}
          </p>
          <p className="text-xs text-text-caption mt-0.5">
            마지막 학습 · {memberData?.nicknameChangedAt ? "최근" : "기록 없음"}
          </p>
        </div>
        {/* 닉네임 수정 버튼 */}
        <button
          type="button"
          onClick={handleNicknameEditClick}
          className="w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center transition-colors hover:text-brand text-text-caption"
          aria-label="닉네임 변경"
        >
          <Pencil size={14} />
        </button>
      </section>

      {/* 오답 노트 섹션 */}
      <section className={s2.className}>
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
          {/* 오답 노트 헤더 */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-text-primary">오답 노트</span>
              {totalWrongCount > 0 && (
                <span className="text-[11px] font-semibold bg-sem-error-light text-sem-error px-2 py-0.5 rounded-full">
                  {totalWrongCount}개
                </span>
              )}
            </div>
            {totalWrongCount > 5 && (
              <button
                type="button"
                onClick={() => navigate("/mypage/wrong-questions")}
                className="flex items-center gap-0.5 text-xs text-brand font-medium"
              >
                전체보기
                <ChevronRight size={12} />
              </button>
            )}
          </div>

          {/* 오답 목록 */}
          {wrongLoading && (
            <div className="space-y-0">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
                  <div className="w-9 h-9 rounded-[10px] bg-border animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-border rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-border rounded animate-pulse w-1/3" />
                  </div>
                  <div className="w-16 h-7 bg-border rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {wrongError && (
            <div className="px-4 py-6">
              <ErrorFallback onRetry={() => refetchWrong()} />
            </div>
          )}

          {!wrongLoading && !wrongError && wrongItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-caption text-sm">틀린 문제가 없어요</p>
              <p className="text-xs text-text-caption mt-1">문제를 풀면 오답이 여기에 쌓여요</p>
            </div>
          )}

          {!wrongLoading && !wrongError && wrongItems.length > 0 && (
            <div>
              {wrongItems.map((item) => (
                <WrongQuestionRow key={item.questionUuid} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-brand text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md whitespace-nowrap">
            {toastMsg}
          </div>
        </div>
      )}

      <NicknameChangeModal
        isOpen={isNicknameModalOpen}
        currentNickname={nickname || ""}
        onClose={() => setIsNicknameModalOpen(false)}
        onSuccess={() => showToast("닉네임이 변경됐어요")}
      />
    </div>
  );
}
