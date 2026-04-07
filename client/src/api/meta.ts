import { apiFetch } from "./client";
import type { TopicTree, ConceptTag } from "../types/api";

export function fetchTopics(): Promise<TopicTree[]> {
  return apiFetch("/meta/topics");
}

export function fetchTags(): Promise<ConceptTag[]> {
  return apiFetch("/meta/tags");
}
