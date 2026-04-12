import { useState, useRef, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";
import type { TopicStat } from "../types/api";

interface StatsTopicListProps {
  readonly topicStats: readonly TopicStat[];
}

// 정답률에 따라 색상 클래스 결정
function getRateColor(rate: number): { badge: string; bar: string } {
  if (rate >= 0.8) return { badge: "text-sem-success-text bg-sem-success-light", bar: "bg-sem-success" };
  if (rate >= 0.6) return { badge: "text-brand bg-accent-light",                  bar: "bg-brand" };
  if (rate >= 0.4) return { badge: "text-sem-warning-text bg-sem-warning-light",  bar: "bg-sem-warning" };
  return           { badge: "text-sem-error-text bg-sem-error-light",             bar: "bg-sem-error" };
}

// ? 팝오버 — portal로 body에 렌더링해 stacking context 격리 문제 회피
const POPOVER_WIDTH = 240; // w-60 = 240px

function TopicListPopover({
  open,
  anchorRef,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, arrowLeft: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    // fixed 포지셔닝 — getBoundingClientRect()는 이미 뷰포트 기준이므로 scrollY 불필요
    const rect = anchorRef.current.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const rawLeft = btnCenterX - 24;
    const clampedLeft = Math.min(rawLeft, window.innerWidth - POPOVER_WIDTH - 8);
    const finalLeft = Math.max(8, clampedLeft);
    const arrowLeft = btnCenterX - finalLeft - 6;

    setPos({
      top: rect.bottom + 8,
      left: finalLeft,
      arrowLeft,
    });
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      className="animate-popover-in fixed w-60 bg-[#1F2937] text-white rounded-xl p-3 z-[9999] shadow-lg"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* 화살표 위치를 버튼 중앙으로 동적 계산 */}
      <div
        className="absolute -top-1.5 w-3 h-1.5 bg-[#1F2937] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"
        style={{ left: pos.arrowLeft }}
      />
      <p className="text-xs font-bold mb-2">어떻게 보나요?</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-sm bg-brand mt-0.5 shrink-0" />
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">막대 길이</span> — 해당 토픽을 얼마나 많이 풀었는지 나타내요
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-sm bg-sem-error mt-0.5 shrink-0" />
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">색상 뱃지</span> — 정답률을 나타내요. 빨간색일수록 취약한 영역이에요
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// 범례 항목
const LEGEND = [
  { color: "bg-sem-success", label: "80%↑" },
  { color: "bg-brand",       label: "60%↑" },
  { color: "bg-sem-warning", label: "40%↑" },
  { color: "bg-sem-error",   label: "취약" },
] as const;

export default function StatsTopicList({ topicStats }: StatsTopicListProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // 바깥 클릭 시 팝오버 닫기
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setPopoverOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  // 막대 길이 기준 — 전체 토픽 중 가장 많이 푼 문제 수
  const maxSolved = Math.max(...topicStats.map((s) => s.solvedCount), 1);

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
      {/* 헤더 + ? 버튼 */}
      <div className="flex items-center gap-1.5 mb-4">
        <h2 className="text-base font-bold text-text-primary">토픽별 학습 현황</h2>
        <button
          ref={btnRef}
          onClick={() => setPopoverOpen((v) => !v)}
          className="w-4 h-4 rounded-full bg-surface-code flex items-center justify-center shrink-0"
          aria-label="토픽별 학습 현황 설명"
        >
          <HelpCircle size={10} className="text-text-caption" />
        </button>
        <TopicListPopover open={popoverOpen} anchorRef={btnRef} />
      </div>

      {/* 토픽 목록 */}
      <div className="flex flex-col gap-3.5">
        {topicStats.map((stat) => {
          const unsolved = stat.solvedCount === 0;
          const colors = unsolved ? null : getRateColor(stat.correctRate);
          const barWidth = unsolved ? 0 : Math.round((stat.solvedCount / maxSolved) * 100);

          return (
            <div key={stat.topicUuid}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-[13px] font-medium ${unsolved ? "text-text-caption" : "text-text-primary"}`}>
                  {stat.displayName}
                </span>
                {unsolved ? (
                  <span className="text-[12px] text-border">미학습</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-text-caption">{stat.solvedCount}문제</span>
                    <span className={`text-[11px] font-semibold px-1.5 py-px rounded-full ${colors!.badge}`}>
                      {Math.round(stat.correctRate * 100)}%
                    </span>
                  </div>
                )}
              </div>
              {/* 진행 바 — div 기반 (색상 클래스 동적 적용을 위해 daisyUI progress 대신 사용) */}
              <div className="w-full h-2 bg-surface-code rounded-full overflow-hidden">
                {!unsolved && (
                  <div
                    className={`h-full rounded-full transition-all duration-500 [width:var(--bar-w)] ${colors!.bar}`}
                    style={{ "--bar-w": `${barWidth}%` } as CSSProperties}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-[11px] text-text-caption">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
