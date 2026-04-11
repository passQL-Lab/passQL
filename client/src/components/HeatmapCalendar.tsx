import { useState, useRef, useMemo } from "react";
import type { HeatmapEntry } from "../types/api";

const HEATMAP_COLORS = [
  "#F5F5F5",
  "#EEF2FF",
  "#C7D2FE",
  "#818CF8",
  "#4F46E5",
] as const;

export function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function buildDayMap(entries: readonly HeatmapEntry[]): Map<string, HeatmapEntry> {
  const map = new Map<string, HeatmapEntry>();
  for (const e of entries) {
    map.set(e.date, e);
  }
  return map;
}

export function getLast30Days(): readonly string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // 로컬 타임존 기준으로 YYYY-MM-DD 생성 (toISOString은 UTC 기준이라 한국에서 날짜 밀림 발생)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
  }
  return days;
}

/** 날짜 문자열(YYYY-MM-DD)을 "4월 12일" 형식으로 변환 — 문자열 슬라이싱으로 타임존 문제 회피 */
function formatDateKo(dateStr: string): string {
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));
  return `${month}월 ${day}일`;
}

interface TooltipState {
  date: string;
  solvedCount: number;
  correctCount: number;
  /** 툴팁을 띄울 셀의 DOM rect (위치 계산용) */
  cellRect: DOMRect;
}

interface HeatmapCalendarProps {
  readonly entries: readonly HeatmapEntry[];
}

export function HeatmapCalendar({ entries }: HeatmapCalendarProps) {
  // entries가 바뀔 때만 Map 재생성
  const dayMap = useMemo(() => buildDayMap(entries), [entries]);
  // 마운트 시 한 번만 계산
  const days = useMemo(() => getLast30Days(), []);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  // 모바일 long press 타이머
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 컨테이너 ref — 툴팁 위치를 컨테이너 기준으로 계산
  const containerRef = useRef<HTMLDivElement>(null);

  // tooltip state가 바뀔 때만 위치 재계산
  const tooltipStyle = useMemo((): React.CSSProperties => {
    if (!tooltip || !containerRef.current) return { display: "none" };
    const containerRect = containerRef.current.getBoundingClientRect();
    const cellCenterX = tooltip.cellRect.left - containerRect.left + tooltip.cellRect.width / 2;
    const cellTopY = tooltip.cellRect.top - containerRect.top;
    return {
      left: cellCenterX,
      top: cellTopY - 8, // 셀 위 8px 간격
      transform: "translateX(-50%) translateY(-100%)",
    };
  }, [tooltip]);

  const hideTooltip = () => setTooltip(null);

  return (
    // position: relative — 툴팁 absolute 기준점
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1">
        {days.map((date) => {
          const entry = dayMap.get(date) ?? { date, solvedCount: 0, correctCount: 0 };
          const level = getLevel(entry.solvedCount);
          // 타임존 문제 회피: 문자열에서 직접 일(day) 추출
          const dayLabel = Number(date.slice(8, 10));
          return (
            <div
              key={date}
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] cursor-default select-none"
              style={{
                backgroundColor: HEATMAP_COLORS[level],
                color: level >= 3 ? "#FFFFFF" : "#9CA3AF",
              }}
              onMouseEnter={(e) => setTooltip({
                date: entry.date,
                solvedCount: entry.solvedCount,
                correctCount: entry.correctCount,
                cellRect: e.currentTarget.getBoundingClientRect(),
              })}
              onMouseLeave={hideTooltip}
              onTouchStart={(e) => {
                const target = e.currentTarget;
                // 500ms 이상 누르면 long press로 판정
                longPressTimer.current = setTimeout(() => {
                  setTooltip({
                    date: entry.date,
                    solvedCount: entry.solvedCount,
                    correctCount: entry.correctCount,
                    cellRect: target.getBoundingClientRect(),
                  });
                }, 500);
              }}
              onTouchEnd={() => {
                if (longPressTimer.current) {
                  clearTimeout(longPressTimer.current);
                  longPressTimer.current = null;
                }
              }}
              onTouchMove={() => {
                // 스크롤 시 long press 취소
                if (longPressTimer.current) {
                  clearTimeout(longPressTimer.current);
                  longPressTimer.current = null;
                }
              }}
            >
              {dayLabel}
            </div>
          );
        })}
      </div>

      {/* 히트맵 범례 */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-text-caption">0</span>
        {HEATMAP_COLORS.map((color) => (
          <div
            key={color}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] text-text-caption">6+</span>
      </div>

      {/* 툴팁 — hover/long press 시 셀 위에 표시 */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none whitespace-nowrap rounded-lg px-3 py-2 text-xs text-white shadow-lg"
          style={{
            backgroundColor: "#1F2937",
            ...tooltipStyle,
          }}
        >
          <div className="font-medium">{formatDateKo(tooltip.date)}</div>
          <div className="mt-0.5" style={{ color: "#D1D5DB" }}>
            {tooltip.solvedCount > 0
              ? `${tooltip.solvedCount}문제 · 정답률 ${Math.round((tooltip.correctCount / tooltip.solvedCount) * 100)}%`
              : "풀이 없음"}
          </div>
          {/* 툴팁 하단 꼬리 삼각형 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full"
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #1F2937",
            }}
          />
        </div>
      )}
    </div>
  );
}
