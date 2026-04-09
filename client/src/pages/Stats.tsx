import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Box, BarChart3 } from "lucide-react";
import { useProgress } from "../hooks/useProgress";
import { fetchCategoryStats } from "../api/progress";
import ErrorFallback from "../components/ErrorFallback";
import Stats2DChart from "../components/Stats2DChart";
import Stats3DChart from "../components/Stats3DChart";

export default function Stats() {
  const { data: progress, isLoading: progressLoading, isError, refetch } = useProgress();
  const { data: categories } = useQuery({
    queryKey: ["categoryStats"],
    queryFn: fetchCategoryStats,
    staleTime: 1000 * 60 * 5,
  });
  const [view, setView] = useState<"2d" | "3d">("3d");
  const navigate = useNavigate();

  const handleCategoryClick = (_code: string) => {
    navigate("/questions");
  };

  if (progressLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-48 rounded-xl bg-border animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-h1">내 실력, 한눈에</h1>
        <p className="text-secondary mt-1">약한 막대를 눌러 바로 연습해보세요</p>
      </div>

      <div className="card-base flex items-center divide-x divide-border">
        {[
          { value: String(progress?.solvedCount ?? 0), label: "푼 문제" },
          { value: `${Math.round((progress?.correctRate ?? 0) * 100)}%`, label: "정답률" },
          { value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
        ].map((m) => (
          <div key={m.label} className="flex-1 text-center py-2">
            <p className="text-h1 text-text-primary">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">카테고리별 실력</h2>
        <div className="flex bg-border rounded-lg p-0.5">
          <button
            type="button"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "2d" ? "bg-surface-card text-text-primary" : "text-text-caption"
            }`}
            onClick={() => setView("2d")}
          >
            <BarChart3 size={14} /> 2D
          </button>
          <button
            type="button"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === "3d" ? "bg-surface-card text-text-primary" : "text-text-caption"
            }`}
            onClick={() => setView("3d")}
          >
            <Box size={14} /> 3D
          </button>
        </div>
      </div>

      {categories && categories.length > 0 ? (
        view === "3d" ? (
          <Stats3DChart categories={categories} onCategoryClick={handleCategoryClick} />
        ) : (
          <Stats2DChart categories={categories} onCategoryClick={handleCategoryClick} />
        )
      ) : (
        <div className="card-base text-center py-12">
          <p className="text-text-caption">아직 풀이 기록이 없어요</p>
          <p className="text-xs text-text-caption mt-1">문제를 풀면 여기에 실력이 나타나요</p>
        </div>
      )}
    </div>
  );
}
