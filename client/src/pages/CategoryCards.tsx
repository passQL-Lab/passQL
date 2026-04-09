import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTopics } from "../hooks/useTopics";
import { getTopicIcon } from "../constants/topicIcons";
import { generatePractice } from "../api/practice";
import { usePracticeStore } from "../stores/practiceStore";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorFallback from "../components/ErrorFallback";

export default function CategoryCards() {
  const { data: topics, isLoading, isError, refetch } = useTopics();
  const [generating, setGenerating] = useState<string | null>(null);
  const navigate = useNavigate();
  const startSession = usePracticeStore((s) => s.startSession);

  const handleSelect = async (code: string, displayName: string) => {
    setGenerating(displayName);
    try {
      const { sessionId, questions } = await generatePractice(code);
      startSession(sessionId, code, displayName, questions);
      navigate(`/practice/${sessionId}`);
    } catch {
      setGenerating(null);
    }
  };

  if (isError) return <ErrorFallback onRetry={() => refetch()} />;

  return (
    <div className="py-6">
      <h1 className="text-h1 mb-1">문제 풀기</h1>
      <p className="text-secondary mb-6">
        카테고리를 선택하면 AI가 맞춤 문제 10개를 생성합니다
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
                className="card-base flex flex-col items-center text-center cursor-pointer hover:border-brand transition-colors"
                onClick={() => handleSelect(t.code, t.displayName)}
              >
                <div className="w-11 h-11 bg-accent-light rounded-[10px] flex items-center justify-center mb-3">
                  <Icon size={22} className="text-brand" />
                </div>
                <span className="text-body font-bold">{t.displayName}</span>
                <span className="text-xs text-text-caption mt-1">
                  {t.subtopics.length > 0 ? t.subtopics.map((s) => s.displayName).join(", ") : t.displayName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {generating && <LoadingOverlay topicName={generating} />}
    </div>
  );
}
