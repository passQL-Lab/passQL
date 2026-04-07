/** Surface Hierarchy */
export const SURFACE = {
  base: "#f9f9f9",
  card: "#ffffff",
  muted: "#f3f3f3",
  active: "#e8e8e8",
} as const;

/** Primary Brand Colors */
export const BRAND = {
  indigo: "#3525cd",
  indigoLight: "#4f46e5",
} as const;

/** Text Colors */
export const TEXT = {
  primary: "#111827",
  secondary: "#6b7280",
  muted: "#9ca3af",
} as const;

/** Semantic Colors */
export const SEMANTIC = {
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const;

/** Toast / Dark UI */
export const DARK_UI = {
  toast: "#1f2937",
} as const;

/** Typography Font Families */
export const FONT_FAMILY = {
  display: "'Manrope', sans-serif",
  body: "'Pretendard Variable', 'Pretendard', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/** Border Radius (px) */
export const RADIUS = {
  box: 12,
  field: 12,
  pill: 999,
} as const;

/** Ambient Shadow */
export const SHADOW = {
  ambient: "0 12px 40px rgba(17, 24, 39, 0.06)",
} as const;
