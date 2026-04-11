import {
  Database, Table, PencilLine, Sigma, Combine,
  Layers, BarChart3, AppWindow, Network, HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 9개 토픽 코드 완전 명시 — fallback 랜덤 로직 제거
const TOPIC_ICON_MAP: Readonly<Record<string, LucideIcon>> = {
  data_modeling: Database,
  sql_basic_select: Table,
  sql_ddl_dml_tcl: PencilLine,
  sql_function: Sigma,
  sql_join: Combine,
  sql_subquery: Layers,
  sql_group_aggregate: BarChart3,
  sql_window: AppWindow,
  sql_hierarchy_pivot: Network,
};

export function getTopicIcon(code: string): LucideIcon {
  return TOPIC_ICON_MAP[code] ?? HelpCircle;
}
