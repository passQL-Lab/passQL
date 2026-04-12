import { useState, useRef, type ReactNode } from "react";

interface StepNavigatorProps {
  readonly steps: readonly ReactNode[];
  readonly lastButtonLabel?: string;
  readonly onLastStep?: () => void;
}

export default function StepNavigator({ steps, lastButtonLabel = "카테고리 목록으로", onLastStep }: StepNavigatorProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const total = steps.length;
  const isLast = current === total - 1;

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < total) setCurrent(idx);
  };

  const handleNext = () => {
    if (current < total - 1) goTo(current + 1);
    else onLastStep?.();
  };

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        // 50px 이상 스와이프 시 앞/뒤 이동
        if (diff > 50) handleNext();
        else if (diff < -50) goTo(current - 1);
      }}
    >
      {/* 상단 인디케이터 — 헤더 대신 단계 수만 표시 */}
      <div className="flex justify-center gap-1.5 pt-4 pb-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-brand" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* 콘텐츠 영역 */}
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

      {/* 하단 버튼 — 아이콘 없이 텍스트만 */}
      <div className="px-6 pb-6">
        <button
          type="button"
          className="w-full h-12 bg-brand text-white font-bold rounded-xl"
          onClick={handleNext}
        >
          {isLast ? lastButtonLabel : "다음"}
        </button>
      </div>
    </div>
  );
}
