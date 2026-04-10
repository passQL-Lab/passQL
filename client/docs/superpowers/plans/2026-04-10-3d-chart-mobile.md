# 3D 차트 모바일 조작 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일에서 3D 통계 차트를 조이스틱으로 회전하고, 바 위 상시 라벨로 정보를 확인할 수 있게 한다.

**Architecture:** Stats3DChart에 터치 이벤트와 상시 라벨을 추가하고, 별도 JoystickPad 컴포넌트를 오버레이로 배치. 기존 데스크톱 마우스 인터랙션은 그대로 유지.

**Tech Stack:** React, Three.js (순수), TypeScript, Tailwind CSS

---

### Task 1: JoystickPad 컴포넌트 생성

**Files:**
- Create: `src/components/JoystickPad.tsx`

- [ ] **Step 1: JoystickPad 컴포넌트 작성**

```tsx
// src/components/JoystickPad.tsx
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
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/JoystickPad.tsx
git commit -m "feat: JoystickPad 컴포넌트 생성 #41"
```

---

### Task 2: Stats3DChart에 상시 라벨 추가 + 하단 라벨 제거

**Files:**
- Modify: `src/components/Stats3DChart.tsx:107-123` (바 생성 루프 내 라벨 부분)

- [ ] **Step 1: 하단 이름 라벨을 상단 이름+정답률 라벨로 교체**

`Stats3DChart.tsx`의 `categories.forEach` 루프 안에서 기존 라벨 코드(108~122행)를 다음으로 교체:

```tsx
      // Top label: name + rate (always visible)
      const canvas2d = document.createElement("canvas");
      canvas2d.width = 256;
      canvas2d.height = 128;
      const ctx = canvas2d.getContext("2d")!;
      ctx.textAlign = "center";
      // Category name
      ctx.fillStyle = "#111827";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(cat.displayName, 128, 48);
      // Rate percentage
      ctx.fillStyle = getColorHex(cat.correctRate);
      ctx.font = "bold 30px sans-serif";
      ctx.fillText(`${Math.round(cat.correctRate * 100)}%`, 128, 90);

      const texture = new THREE.CanvasTexture(canvas2d);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture }),
      );
      sprite.position.set(x, height + 0.6, z);
      sprite.scale.set(2, 1, 1);
      sprite.userData = { isLabel: true, barIndex: i };
      scene.add(sprite);
```

이 라벨은 바 위에 항상 표시되며, grow 애니메이션과 동기화해야 한다.

- [ ] **Step 2: 라벨 참조 배열 추가**

`const bars: THREE.Mesh[] = [];` 아래에 추가:

```tsx
    const labels: THREE.Sprite[] = [];
```

그리고 라벨 생성 코드 끝에 `labels.push(sprite);` 추가.

- [ ] **Step 3: grow 애니메이션에서 라벨 위치 동기화**

`animate` 함수의 bars.forEach 루프 안에서 라벨 위치도 업데이트:

```tsx
        bars.forEach((bar, idx) => {
          const h =
            (bar.userData as { targetHeight: number }).targetHeight * eased;
          bar.scale.y = eased;
          bar.position.y = h / 2;
          if (labels[idx]) {
            labels[idx].position.y = h + 0.6;
          }
        });
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/Stats3DChart.tsx
git commit -m "feat: 3D 차트 바 위에 카테고리명+정답률 상시 라벨 표시 #41"
```

---

### Task 3: Stats3DChart에 터치 이벤트 추가 (탭으로 바 클릭)

**Files:**
- Modify: `src/components/Stats3DChart.tsx:236-242` (이벤트 리스너 등록 영역)

- [ ] **Step 1: 터치 상태 변수 추가**

`let hoveredBar` 선언 아래에 추가:

```tsx
    let touchStart = { x: 0, y: 0 };
```

- [ ] **Step 2: 터치 이벤트 핸들러 추가**

`onWheel` 함수 아래에 추가:

```tsx
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      // 이동 거리 10px 미만이면 탭으로 판정
      if (Math.sqrt(dx * dx + dy * dy) > 10) return;

      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((t.clientX - rect.left) / rect.width) * 2 - 1,
        -((t.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bars);
      if (intersects.length > 0) {
        const data = intersects[0].object.userData as CategoryStats;
        onCategoryClick?.(data.code);
      }
    };
```

- [ ] **Step 3: 이벤트 리스너 등록/해제**

기존 이벤트 리스너 등록 블록(`container.addEventListener(...)`)에 추가:

```tsx
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd);
```

cleanup return 안에 추가:

```tsx
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/Stats3DChart.tsx
git commit -m "feat: 3D 차트 모바일 터치 탭으로 바 클릭 지원 #41"
```

---

### Task 4: Stats3DChart에 조이스틱 연결

**Files:**
- Modify: `src/components/Stats3DChart.tsx` (JSX return + joystick 콜백)

- [ ] **Step 1: JoystickPad import 추가**

파일 상단에 추가:

```tsx
import JoystickPad from "./JoystickPad";
```

- [ ] **Step 2: 조이스틱 콜백을 위한 ref 추가**

`const tooltipRef` 아래에 추가:

```tsx
  const sphericalRef = useRef({ theta: 0.5, phi: Math.PI / 3, radius: 10 });
  const updateCameraRef = useRef<(() => void) | null>(null);
```

- [ ] **Step 3: useEffect 안에서 ref 연결**

`updateCamera();` 호출 직후에 추가:

```tsx
    sphericalRef.current = spherical;
    updateCameraRef.current = updateCamera;
```

기존 `const spherical = { theta: 0.5, phi: Math.PI / 3, radius: 10 };`는 그대로 유지 (useEffect 내부 로컬 변수).

- [ ] **Step 4: 조이스틱 onMove 핸들러 추가**

컴포넌트 본문 (`useEffect` 밖, return 전)에 추가:

```tsx
  const handleJoystick = useCallback((dx: number, dy: number) => {
    const s = sphericalRef.current;
    s.theta -= dx * 0.03;
    s.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.1, s.phi + dy * 0.03));
    updateCameraRef.current?.();
  }, []);
```

- [ ] **Step 5: JSX에 조이스틱 배치**

return문을 다음으로 변경:

```tsx
  return (
    <>
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full h-[50vh] rounded-xl overflow-hidden cursor-grab"
        />
        <JoystickPad onMove={handleJoystick} />
      </div>
      <div
        ref={tooltipRef}
        className="fixed hidden bg-surface-card border border-border rounded-xl p-3 shadow-lg pointer-events-none z-50 min-w-40"
      />
    </>
  );
```

핵심: `relative` 래퍼 안에 Canvas와 JoystickPad가 같이 있어서 `absolute right-4 bottom-4`로 정확히 우측 하단에 위치.

- [ ] **Step 6: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add src/components/Stats3DChart.tsx
git commit -m "feat: 3D 차트에 조이스틱 연결 — 모바일 카메라 회전 지원 #41"
```

---

### Task 5: 수동 검증

- [ ] **Step 1: 개발 서버 실행 후 데스크톱 확인**

Run: `npm run dev`

확인 사항:
- 3D 차트에 바 위 라벨(이름+정답률) 상시 표시되는지
- 마우스 드래그로 카메라 회전 여전히 동작하는지
- 호버 툴팁 여전히 동작하는지
- 바 클릭으로 연습 시작 동작하는지
- 우측 하단 조이스틱 패드 표시되는지
- 조이스틱 마우스 드래그로 카메라 회전되는지

- [ ] **Step 2: 모바일(또는 DevTools 모바일 에뮬레이션) 확인**

확인 사항:
- 조이스틱 터치 드래그로 카메라 회전되는지
- 바 탭으로 연습 시작되는지
- 바 위 라벨이 정상 표시되는지
- grow 애니메이션 중 라벨 위치가 바와 동기화되는지
