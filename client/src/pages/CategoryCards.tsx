import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Sparkles } from "lucide-react";
import { useTopics } from "../hooks/useTopics";
import { getTopicIcon } from "../constants/topicIcons";
import { generatePractice } from "../api/practice";
import { usePracticeStore } from "../stores/practiceStore";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorFallback from "../components/ErrorFallback";

export default function CategoryCards() {
  const { data: topics, isLoading, isError, refetch } = useTopics();
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const startSession = usePracticeStore((s) => s.startSession);

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
      <h1 className="text-h1 mb-1 flex items-center gap-2">
        <Sparkles size={24} fill="currentColor" />
        AI문제 풀기
      </h1>
      <p className="text-secondary mb-6">
        골라보세요, AI가 딱 맞는 문제를 만들어드릴게요
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="card-base h-28 animate-pulse bg-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {topics?.map((t) => {
            const Icon = getTopicIcon(t.code);
            return (
              <button
                key={t.code}
                type="button"
                className="card-base flex flex-col items-center text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-brand"
                onClick={() => handleSelect(t.code, t.displayName)}
              >
                <div className="w-11 h-11 bg-accent-light rounded-[10px] flex items-center justify-center mb-3">
                  <Icon size={22} className="text-brand" />
                </div>
                <span className="text-body font-bold">{t.displayName}</span>
              </button>
            );
          })}
        </div>
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
