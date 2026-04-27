// src/dev/panels/StorePanel.tsx
import { useAuthStore } from "../../stores/authStore";
import { usePracticeStore } from "../../stores/practiceStore";

export function StorePanel() {
  // 전체 상태를 구독 — Zustand 변경 시 자동 리렌더
  const auth = useAuthStore();
  const practice = usePracticeStore();

  const sections = [
    {
      name: "authStore",
      data: {
        memberUuid: auth.memberUuid,
        nickname: auth.nickname,
        // 토큰 원문 대신 존재 여부만 표시 — 보안 정보 노출 방지
        hasAccessToken: !!auth.accessToken,
        hasRefreshToken: !!auth.refreshToken,
        isRefreshing: auth.isRefreshing,
      },
    },
    {
      name: "practiceStore",
      data: {
        sessionId: practice.sessionId,
        topicCode: practice.topicCode,
        currentIndex: practice.currentIndex,
        questionsCount: practice.questions.length,
        resultsCount: practice.results.length,
        startedAt: practice.startedAt,
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
