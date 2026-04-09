import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CategoryStats } from "../types/api";

function getColor(rate: number): number {
  if (rate >= 0.8) return 0x22C55E;
  if (rate >= 0.6) return 0x4F46E5;
  if (rate >= 0.4) return 0xF59E0B;
  return 0xEF4444;
}

function getEmissive(rate: number): number {
  if (rate >= 0.8) return 0x16A34A;
  if (rate >= 0.6) return 0x3730A3;
  if (rate >= 0.4) return 0xD97706;
  return 0xDC2626;
}

function getColorHex(rate: number): string {
  if (rate >= 0.8) return "#22C55E";
  if (rate >= 0.6) return "#4F46E5";
  if (rate >= 0.4) return "#F59E0B";
  return "#EF4444";
}

interface Stats3DChartProps {
  readonly categories: readonly CategoryStats[];
  readonly onCategoryClick?: (code: string) => void;
}

export default function Stats3DChart({ categories, onCategoryClick }: Stats3DChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip || categories.length === 0) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAFAFA);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights — r183 물리 기반 조명은 r128보다 강도를 높여야 동일 밝기
    scene.add(new THREE.AmbientLight(0xffffff, 3));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(5, 10, 7);
    sun.castShadow = true;
    scene.add(sun);

    // Ground + grid
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xF3F4F6 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(10, 10, 0xE5E7EB, 0xE5E7EB);
    grid.position.y = 0.01;
    scene.add(grid);

    // Bars
    const bars: THREE.Mesh[] = [];
    const cols = Math.min(categories.length, 3);
    const rows = Math.ceil(categories.length / cols);
    const spacing = 2.2;
    const barWidth = 1.0;

    categories.forEach((cat, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = (col - (cols - 1) / 2) * spacing;
      const z = (row - (rows - 1) / 2) * spacing;
      const height = cat.correctRate * 5 + 0.3;

      const geo = new THREE.BoxGeometry(barWidth, height, barWidth);
      const mat = new THREE.MeshStandardMaterial({
        color: getColor(cat.correctRate),
        emissive: getEmissive(cat.correctRate),
        emissiveIntensity: 0.1,
        metalness: 0.08,
        roughness: 0.65,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, z);
      mesh.castShadow = true;
      mesh.userData = { ...cat, targetHeight: height };
      scene.add(mesh);
      bars.push(mesh);

      // Name label
      const canvas2d = document.createElement("canvas");
      canvas2d.width = 256;
      canvas2d.height = 64;
      const ctx = canvas2d.getContext("2d")!;
      ctx.fillStyle = "#6B7280";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(cat.displayName, 128, 40);
      const texture = new THREE.CanvasTexture(canvas2d);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
      sprite.position.set(x, -0.5, z);
      sprite.scale.set(2, 0.5, 1);
      scene.add(sprite);
    });

    // Camera
    const spherical = { theta: 0.5, phi: Math.PI / 3, radius: 10 };
    function updateCamera() {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 1.5, -0.5);
    }
    updateCamera();

    // Interaction state
    let isDragging = false;
    let dragMoved = false;
    let prevMouse = { x: 0, y: 0 };
    let hoveredBar: THREE.Mesh | null = null;

    const onMouseDown = (e: MouseEvent) => { isDragging = true; dragMoved = false; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging = false; };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bars);

      if (hoveredBar && (!intersects.length || intersects[0].object !== hoveredBar)) {
        (hoveredBar.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        hoveredBar.scale.x = 1;
        hoveredBar.scale.z = 1;
        hoveredBar = null;
      }

      if (intersects.length > 0) {
        const bar = intersects[0].object as THREE.Mesh;
        const data = bar.userData as CategoryStats & { targetHeight: number };
        hoveredBar = bar;
        (bar.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
        bar.scale.x = 1.1;
        bar.scale.z = 1.1;
        container.style.cursor = "pointer";

        tooltip.style.display = "block";
        tooltip.style.left = `${e.clientX + 16}px`;
        tooltip.style.top = `${e.clientY - 80}px`;
        tooltip.innerHTML = `
          <div style="font-size:15px;font-weight:700;margin-bottom:4px">${data.displayName}</div>
          <div style="font-size:24px;font-weight:700;color:${getColorHex(data.correctRate)}">${Math.round(data.correctRate * 100)}%</div>
          <div style="font-size:12px;color:#6B7280;margin-top:4px">${data.solvedCount}문제 풀이</div>
          <div style="height:4px;background:#E5E7EB;border-radius:2px;margin-top:8px">
            <div style="height:4px;border-radius:2px;width:${data.correctRate * 100}%;background:${getColorHex(data.correctRate)}"></div>
          </div>
          <div style="font-size:11px;color:#4F46E5;margin-top:8px;font-weight:500">클릭하여 연습하기</div>
        `;
      } else {
        tooltip.style.display = "none";
        container.style.cursor = isDragging ? "grabbing" : "grab";
      }

      if (!isDragging) return;
      dragMoved = true;
      spherical.theta -= (e.clientX - prevMouse.x) * 0.01;
      spherical.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.1, spherical.phi + (e.clientY - prevMouse.y) * 0.01));
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const onClick = (e: MouseEvent) => {
      if (dragMoved) return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bars);
      if (intersects.length > 0) {
        const data = intersects[0].object.userData as CategoryStats;
        onCategoryClick?.(data.code);
      }
    };

    const onWheel = (e: WheelEvent) => {
      spherical.radius = Math.max(5, Math.min(20, spherical.radius + e.deltaY * 0.01));
      updateCamera();
    };

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mouseleave", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("click", onClick);
    container.addEventListener("wheel", onWheel);

    // Grow animation
    let progress = 0;
    let animId = 0;
    function animate() {
      animId = requestAnimationFrame(animate);
      if (progress < 1) {
        progress = Math.min(1, progress + 0.015);
        const eased = 1 - Math.pow(1 - progress, 3);
        bars.forEach((bar) => {
          const h = (bar.userData as { targetHeight: number }).targetHeight * eased;
          bar.scale.y = eased;
          bar.position.y = h / 2;
        });
      }
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mouseleave", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("click", onClick);
      container.removeEventListener("wheel", onWheel);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [categories, onCategoryClick]);

  return (
    <>
      <div ref={containerRef} className="w-full h-[50vh] rounded-xl overflow-hidden cursor-grab" />
      <div
        ref={tooltipRef}
        className="fixed hidden bg-surface-card border border-border rounded-xl p-3 shadow-lg pointer-events-none z-50 min-w-40"
      />
    </>
  );
}
