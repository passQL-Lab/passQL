import { useState, useEffect, useRef } from "react";

const COLOR_SCALE = [
  "#EF4444", "#EF4444", "#EF4444", "#EF4444",
  "#F59E0B", "#F59E0B", "#F59E0B",
  "#4F46E5", "#4F46E5",
  "#22C55E", "#22C55E",
] as const;

interface ScoreCountUpProps {
  readonly target: number;
  readonly total: number;
  readonly onComplete?: () => void;
}

export default function ScoreCountUp({ target, total, onComplete }: ScoreCountUpProps) {
  const [count, setCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (target <= 0) {
      setTimeout(() => onCompleteRef.current?.(), 200);
      return;
    }
    let step = 0;
    const tick = () => {
      step++;
      setCount(step);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 200);
      if (step < target) {
        setTimeout(tick, 60 + step * 30);
      } else {
        setTimeout(() => onCompleteRef.current?.(), 200);
      }
    };
    const timer = setTimeout(tick, 200);
    return () => clearTimeout(timer);
  }, [target]);

  const color = COLOR_SCALE[count] ?? COLOR_SCALE[0];

  return (
    <div
      className="text-[96px] font-bold leading-none transition-colors duration-200"
      style={{
        color,
        transform: animating ? "scale(1.3)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s",
      }}
    >
      {count} <span className="text-4xl font-normal text-text-caption">/ {total}</span>
    </div>
  );
}
