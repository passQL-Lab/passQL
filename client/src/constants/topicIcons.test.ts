import { describe, it, expect } from "vitest";
import { getTopicIcon } from "./topicIcons";
import {
  Database, Table, PencilLine, Sigma, Combine,
  Layers, BarChart3, AppWindow, Network, HelpCircle,
} from "lucide-react";

describe("getTopicIcon", () => {
  it("data_modeling → Database", () => {
    expect(getTopicIcon("data_modeling")).toBe(Database);
  });

  it("sql_basic_select → Table", () => {
    expect(getTopicIcon("sql_basic_select")).toBe(Table);
  });

  it("sql_ddl_dml_tcl → PencilLine", () => {
    expect(getTopicIcon("sql_ddl_dml_tcl")).toBe(PencilLine);
  });

  it("sql_function → Sigma", () => {
    expect(getTopicIcon("sql_function")).toBe(Sigma);
  });

  it("sql_join → Combine", () => {
    expect(getTopicIcon("sql_join")).toBe(Combine);
  });

  it("sql_subquery → Layers", () => {
    expect(getTopicIcon("sql_subquery")).toBe(Layers);
  });

  it("sql_group_aggregate → BarChart3", () => {
    expect(getTopicIcon("sql_group_aggregate")).toBe(BarChart3);
  });

  it("sql_window → AppWindow", () => {
    expect(getTopicIcon("sql_window")).toBe(AppWindow);
  });

  it("sql_hierarchy_pivot → Network", () => {
    expect(getTopicIcon("sql_hierarchy_pivot")).toBe(Network);
  });

  it("unknown code → HelpCircle fallback", () => {
    expect(getTopicIcon("unknown_code")).toBe(HelpCircle);
  });

  it("두 번 호출해도 같은 아이콘 반환 (랜덤 아님)", () => {
    expect(getTopicIcon("sql_join")).toBe(getTopicIcon("sql_join"));
  });
});
