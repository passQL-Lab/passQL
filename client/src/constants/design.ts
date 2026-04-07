/** Page & Surface */
export const SURFACE = {
  page: "#FAFAFA",
  card: "#FFFFFF",
  code: "#F3F4F6",
  zebra: "#FAFAFA",
} as const;

/** Brand Colors */
export const BRAND = {
  primary: "#4F46E5",
  light: "#EEF2FF",
  medium: "#818CF8",
} as const;

/** Text Colors */
export const TEXT = {
  primary: "#111827",
  secondary: "#6B7280",
  caption: "#9CA3AF",
} as const;

/** Border Colors */
export const BORDER = {
  default: "#E5E7EB",
  muted: "#D1D5DB",
} as const;

/** Semantic Colors */
export const SEMANTIC = {
  success: "#22C55E",
  successLight: "#F0FDF4",
  successText: "#16A34A",
  error: "#EF4444",
  errorLight: "#FEF2F2",
  errorText: "#DC2626",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningText: "#D97706",
} as const;

/** Toast / Dark UI */
export const DARK_UI = {
  toast: "#1F2937",
  overlay: "rgba(17, 24, 39, 0.5)",
} as const;

/** Heatmap 5 levels (0-30%, 31-50%, 51-70%, 71-85%, 86-100%) */
export const HEATMAP = {
  level0: "#F5F5F5",
  level1: "#EEF2FF",
  level2: "#C7D2FE",
  level3: "#818CF8",
  level4: "#4F46E5",
} as const;

/** Typography Font Families */
export const FONT_FAMILY = {
  ui: "'Pretendard Variable', 'Pretendard', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/** Border Radius (px) */
export const RADIUS = {
  card: 12,
  button: 8,
  code: 8,
  pill: 999,
} as const;
