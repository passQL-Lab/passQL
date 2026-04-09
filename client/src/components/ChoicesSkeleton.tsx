import type { ChoiceGenerationPhase } from "../types/api";

interface ChoicesSkeletonProps {
  readonly phase: ChoiceGenerationPhase;
  readonly message: string;
}

export function ChoicesSkeleton({ phase, message }: ChoicesSkeletonProps) {
  return (
    <div className="mt-4 space-y-3">
      <div className="card-base">
        <p className="text-secondary text-sm animate-pulse">{message}</p>
        <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-brand animate-pulse"
            style={{ width: phase === "validating" ? "75%" : "40%" }}
          />
        </div>
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="card-base space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-border animate-pulse" />
            <div className="w-4 h-4 rounded bg-border animate-pulse" />
          </div>
          <div className="h-16 rounded-lg bg-border animate-pulse" />
        </div>
      ))}
    </div>
  );
}
