import { useState, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StepNavigatorProps {
  readonly steps: readonly ReactNode[];
  readonly lastButtonLabel?: string;
  readonly onLastStep?: () => void;
}

export default function StepNavigator({ steps, lastButtonLabel = "다른 카테고리", onLastStep }: StepNavigatorProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const navigate = useNavigate();
  const total = steps.length;
  const isFirst = current === 0;

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < total) setCurrent(idx);
  };

  const handleNext = () => {
    if (current < total - 1) goTo(current + 1);
    else onLastStep?.();
  };

  const isLast = current === total - 1;

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) handleNext();
        else if (diff < -50) goTo(current - 1);
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center bg-surface-card border border-border rounded-xl"
          onClick={() => isFirst ? navigate("/") : goTo(current - 1)}
        >
          {isFirst ? <Home size={18} className="text-text-primary" /> : <ChevronLeft size={20} className="text-text-primary" />}
        </button>
        <span className="text-sm text-text-secondary font-semibold">
          {current + 1} / {total}
        </span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-400 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {steps.map((step, i) => (
            <div key={i} className="min-w-full h-full flex flex-col items-center justify-center px-6 text-center">
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 py-3">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-brand" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-6">
        <button
          type="button"
          className="w-full h-12 bg-brand text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
          onClick={handleNext}
        >
          {isLast ? lastButtonLabel : "다음"}
          {isLast ? <Grid2x2 size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
