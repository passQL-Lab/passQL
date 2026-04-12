import React, { useState, useRef, type ReactNode } from "react";

interface StepNavigatorProps {
  readonly steps: readonly ReactNode[];
  readonly lastButtonLabel?: string;
  readonly onLastStep?: () => void;
  // 특정 단계에서 시작 — 다시 풀기 후 복귀 시 step3으로 바로 진입
  readonly initialStep?: number;
}

export default function StepNavigator({ steps, lastButtonLabel = "카테고리 목록으로", onLastStep, initialStep = 0 }: StepNavigatorProps) {
  // initialStep을 0..steps.length-1 범위로 clamp — 음수/초과 인덱스 방어
  const [current, setCurrent] = useState(() => Math.max(0, Math.min(initialStep, steps.length - 1)));
  const touchStartX = useRef(0);
  const total = steps.length;
  const isLast = current === total - 1;

  // 범위 가드 내장 — 첫/마지막 단계에서 경계 초과 호출 안전
  const goTo = (idx: number) => {
    if (idx >= 0 && idx < total) setCurrent(idx);
  };

  const handleNext = () => {
    if (current < total - 1) goTo(current + 1);
    else onLastStep?.();
  };
  // 이전 단계 이동은 스와이프(좌)만 지원 — 결과 화면은 단방향 흐름이 의도적

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // 마지막 스텝에서는 탭으로 이동 불가 — 버튼으로만 액션 가능
    if (isLast) return;
    // 버튼, 링크, input 등 인터랙티브 요소 클릭은 탭으로 처리하지 않음
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea")) return;
    handleNext();
  };

  return (
    <div
      className="flex flex-col h-full"
      onClick={handleTap}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        // 마지막 스텝에서는 스와이프 앞으로 이동 불가 — 뒤로만 허용
        if (diff > 50 && !isLast) handleNext();
        else if (diff < -50) goTo(current - 1);
      }}
    >
      {/* 단계 인디케이터 — 스크린리더에 현재 단계 정보 전달 */}
      <div role="tablist" aria-label="단계 표시" className="flex justify-center gap-1.5 pt-4 pb-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`${i + 1}단계 / 전체 ${total}단계`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-brand" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        <div
          className="step-slider"
          style={{ "--step-offset": `-${current * 100}%` } as React.CSSProperties}
        >
          {steps.map((step, i) => (
            // 마지막 스텝은 콘텐츠가 길 수 있으므로 세로 스크롤 허용
            <div key={i} className={`min-w-full h-full flex flex-col items-center text-center ${i === total - 1 ? "overflow-y-auto justify-start pt-4" : "justify-center"}`}>
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 — 아이콘 없이 텍스트만 */}
      <div className="pb-6">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={handleNext}
        >
          {isLast ? lastButtonLabel : "다음"}
        </button>
      </div>
    </div>
  );
}
