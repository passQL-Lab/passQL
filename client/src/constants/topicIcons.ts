import {
  Combine, BarChart3, Layers, Table, ShieldCheck,
  Database, Filter, GitBranch, Box, Braces,
  FileCode, Columns3, ArrowUpDown, Search, Network,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TOPIC_ICON_MAP: Record<string, LucideIcon> = {
  JOIN: Combine,
  GROUP_BY: BarChart3,
  SUBQUERY: Layers,
  DDL: Table,
  CONSTRAINT: ShieldCheck,
};

const FALLBACK_ICONS: readonly LucideIcon[] = [
  Database, Filter, GitBranch, Box, Braces,
  FileCode, Columns3, ArrowUpDown, Search, Network,
];

const dynamicCache = new Map<string, LucideIcon>();

export function getTopicIcon(code: string): LucideIcon {
  const mapped = TOPIC_ICON_MAP[code];
  if (mapped) return mapped;

  const cached = dynamicCache.get(code);
  if (cached) return cached;

  const icon = FALLBACK_ICONS[dynamicCache.size % FALLBACK_ICONS.length];
  dynamicCache.set(code, icon);
  return icon;
}
