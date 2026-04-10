import { useRef, useCallback, useEffect } from "react";

interface JoystickPadProps {
  readonly onMove: (dx: number, dy: number) => void;
}

export default function JoystickPad({ onMove }: JoystickPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const animRef = useRef(0);

  const PAD_SIZE = 64;
  const HANDLE_SIZE = 28;
  const MAX_OFFSET = (PAD_SIZE - HANDLE_SIZE) / 2;

  const getOffset = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current;
      if (!pad) return { dx: 0, dy: 0 };
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawX = clientX - cx;
      const rawY = clientY - cy;
      const dist = Math.sqrt(rawX * rawX + rawY * rawY);
      const clamped = Math.min(dist, MAX_OFFSET);
      const angle = Math.atan2(rawY, rawX);
      return {
        dx: (clamped * Math.cos(angle)) / MAX_OFFSET,
        dy: (clamped * Math.sin(angle)) / MAX_OFFSET,
      };
    },
    [MAX_OFFSET],
  );

  const updateHandle = useCallback(
    (dx: number, dy: number) => {
      const handle = handleRef.current;
      if (!handle) return;
      handle.style.transform = `translate(${dx * MAX_OFFSET}px, ${dy * MAX_OFFSET}px)`;
    },
    [MAX_OFFSET],
  );

  const startDrag = useCallback(() => {
    dragging.current = true;
  }, []);

  const stopDrag = useCallback(() => {
    dragging.current = false;
    updateHandle(0, 0);
    onMove(0, 0);
  }, [onMove, updateHandle]);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging.current) return;
      const { dx, dy } = getOffset(clientX, clientY);
      updateHandle(dx, dy);
      onMove(dx, dy);
    },
    [getOffset, updateHandle, onMove],
  );

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => stopDrag();
    const onMouseMove = (e: MouseEvent) =>
      handleMove(e.clientX, e.clientY);
    const onMouseUp = () => stopDrag();

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleMove, stopDrag]);

  return (
    <div
      ref={padRef}
      className="absolute right-4 bottom-4 rounded-full flex items-center justify-center"
      style={{
        width: PAD_SIZE,
        height: PAD_SIZE,
        background: "rgba(0,0,0,0.08)",
        border: "1px solid #E5E7EB",
        touchAction: "none",
      }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div
        ref={handleRef}
        className="rounded-full"
        style={{
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          background: "#4F46E5",
          transition: dragging.current ? "none" : "transform 0.15s ease-out",
        }}
      />
    </div>
  );
}
