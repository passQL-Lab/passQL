import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Sparkles } from "lucide-react";
import { useTopics } from "../hooks/useTopics";
import { getTopicIcon } from "../constants/topicIcons";
import { generatePractice } from "../api/practice";
import { usePracticeStore } from "../stores/practiceStore";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorFallback from "../components/ErrorFallback";
import { useStagger } from "../hooks/useStagger";

export default function CategoryCards() {
  const { data: topics, isLoading, isError, refetch } = useTopics();
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const startSession = usePracticeStore((s) => s.startSession);

  // 섹션별 순차 페이드인 딜레이 생성
  const stagger = useStagger();
  const s0 = stagger(0); // 제목 + 서브텍스트
  const s1 = stagger(1); // 카드 그리드

  const handleSelect = async (code: string, displayName: string) => {
    setGenerating(displayName);
    setError(null);
    try {
      const { sessionId, questions } = await generatePractice(code);
      startSession(sessionId, code, displayName, questions);
      navigate(`/practice/${sessionId}`);
    } catch {
      setGenerating(null);
      setError("문제 생성에 실패했어요. 다시 시도해주세요.");
    }
  };

  if (isError) return <ErrorFallback onRetry={() => refetch()} />;

  return (
    <div className="py-6">
      {/* CSS variable(--stagger-delay) 주입 — Tailwind로 표현 불가하여 style prop 예외 허용 */}
      {/* ① 제목 + 서브텍스트 */}
      <section className={s0.className}>
        <h1 className="text-h1 mb-1 flex items-center gap-2">
          <Sparkles size={24} fill="currentColor" />
          AI문제 풀기
        </h1>
        <p className="text-secondary mb-6">
          골라보세요, AI가 딱 맞는 문제를 만들어드릴게요
        </p>
      </section>

      {/* ② 카드 그리드 */}
      {isLoading ? (
        <section className={`grid grid-cols-2 lg:grid-cols-3 gap-3 ${s1.className}`}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card-topic pointer-events-none">
              {/* daisyUI skeleton — animate-pulse 대신 shimmer 효과 */}
              <div className="skeleton w-[52px] h-[52px] rounded-[14px] mb-3" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ))}
        </section>
      ) : (
        <section className={`grid grid-cols-2 lg:grid-cols-3 gap-3 ${s1.className}`}>
          {topics?.map((t) => {
            const Icon = getTopicIcon(t.code);
            return (
              <button
                key={t.code}
                type="button"
                className="card-topic"
                onClick={() => handleSelect(t.code, t.displayName)}
              >
                <div className="card-topic-icon">
                  <Icon size={26} className="text-brand" />
                </div>
                <span className="text-body font-bold">{t.displayName}</span>
              </button>
            );
          })}
        </section>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mt-4">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {generating && <LoadingOverlay topicName={generating} />}
    </div>
  );
}
