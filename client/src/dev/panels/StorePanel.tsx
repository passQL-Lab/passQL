// src/dev/panels/StorePanel.tsx
import { useAuthStore } from "../../stores/authStore";
import { usePracticeStore } from "../../stores/practiceStore";

export function StorePanel() {
  // Selector를 활용해 필요한 필드만 구독 — 불필요한 리렌더 방지
  const memberUuid = useAuthStore((s) => s.memberUuid);
  const nickname = useAuthStore((s) => s.nickname);
  const hasAccessToken = useAuthStore((s) => !!s.accessToken);
  const hasRefreshToken = useAuthStore((s) => !!s.refreshToken);
  const isRefreshing = useAuthStore((s) => s.isRefreshing);

  const sessionId = usePracticeStore((s) => s.sessionId);
  const topicCode = usePracticeStore((s) => s.topicCode);
  const currentIndex = usePracticeStore((s) => s.currentIndex);
  const questionsCount = usePracticeStore((s) => s.questions.length);
  const resultsCount = usePracticeStore((s) => s.results.length);
  const startedAt = usePracticeStore((s) => s.startedAt);

  const sections = [
    {
      name: "authStore",
      data: {
        memberUuid,
        nickname,
        hasAccessToken,
        hasRefreshToken,
        isRefreshing,
      },
    },
    {
      name: "practiceStore",
      data: {
        sessionId,
        topicCode,
        currentIndex,
        questionsCount,
        resultsCount,
        startedAt,
      },
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {sections.map(({ name, data }) => (
        <div key={name} className="border-b border-border last:border-0">
          <p className="px-3 py-2 text-xs font-semibold text-text-primary bg-surface">
            {name}
          </p>
          {Object.entries(data).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between px-3 py-1.5 border-t border-border"
            >
              <span className="text-xs text-text-secondary font-mono">{key}</span>
              <span className="text-xs font-mono text-text-primary max-w-[60%] truncate text-right">
                {value === null
                  ? "null"
                  : value === undefined
                    ? "undefined"
                    : String(value)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
