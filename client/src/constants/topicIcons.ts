import { Combine, BarChart3, Layers, Table, ShieldCheck, FileQuestion } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TOPIC_ICON_MAP: Record<string, LucideIcon> = {
  JOIN: Combine,
  GROUP_BY: BarChart3,
  SUBQUERY: Layers,
  DDL: Table,
  CONSTRAINT: ShieldCheck,
};

export const DEFAULT_TOPIC_ICON: LucideIcon = FileQuestion;

export function getTopicIcon(code: string): LucideIcon {
  return TOPIC_ICON_MAP[code] ?? DEFAULT_TOPIC_ICON;
}
