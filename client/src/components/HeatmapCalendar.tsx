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

export function buildDayMap(entries: readonly HeatmapEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.date, e.solvedCount);
  }
  return map;
}

export function getLast30Days(): readonly string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

interface HeatmapCalendarProps {
  readonly entries: readonly HeatmapEntry[];
}

export function HeatmapCalendar({ entries }: HeatmapCalendarProps) {
  const dayMap = buildDayMap(entries);
  const days = getLast30Days();

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {days.map((date) => {
          const count = dayMap.get(date) ?? 0;
          const level = getLevel(count);
          const dayLabel = new Date(date).getDate();
          return (
            <div
              key={date}
              className="w-6 h-6 rounded flex items-center justify-center text-[10px]"
              style={{
                backgroundColor: HEATMAP_COLORS[level],
                color: level >= 3 ? "#FFFFFF" : "#9CA3AF",
              }}
              title={`${date}: ${count}문제`}
            >
              {dayLabel}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-text-caption">0</span>
        {HEATMAP_COLORS.map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] text-text-caption">6+</span>
      </div>
    </div>
  );
}
