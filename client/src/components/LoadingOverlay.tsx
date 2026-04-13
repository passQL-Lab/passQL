import { useState, useEffect } from "react";
import { getRandomMessage, getRandomExecutableGradingMessage } from "../constants/microcopy";

interface LoadingOverlayProps {
  readonly topicName: string;
  /** 전달 시 랜덤 메시지 대신 고정 메시지 표시 (채점 중 등) */
  readonly staticMessage?: string;
  /** staticMessage와 함께 표시할 보조 텍스트 */
  readonly subMessage?: string;
  /** true면 채점 중 메시지에 "실제 DB에서 실행 중" 뱃지 표시 */
  readonly isExecutable?: boolean;
}

export default function LoadingOverlay({ topicName, staticMessage, subMessage, isExecutable }: LoadingOverlayProps) {
  const [message, setMessage] = useState(() => getRandomMessage(topicName));
  // 마운트 시 1회 고정 — JSX 인라인 호출 시 리렌더마다 문구가 바뀌는 문제 방지
  const [executableMsg] = useState(getRandomExecutableGradingMessage);

  useEffect(() => {
    if (staticMessage) return;
    const interval = setInterval(() => {
      setMessage(getRandomMessage(topicName));
    }, 3000);
    return () => clearInterval(interval);
  }, [topicName, staticMessage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-card rounded-xl p-10 text-center max-w-[360px] w-[90%]">
        <div className="w-12 h-12 border-3 border-accent-light border-t-brand rounded-full animate-spin mx-auto mb-5" />
        {!staticMessage && (
          <span className="inline-block bg-accent-light text-brand text-sm font-medium px-3.5 py-1 rounded-full mb-4">
            {topicName}
          </span>
        )}
        <p className="text-body">{staticMessage ?? message}</p>
        <p className="text-xs text-text-caption mt-2">
          {subMessage ?? "잠시만 기다려주세요"}
        </p>
        {/* EXECUTABLE 문제: 실제 DB 실행 중임을 사용자에게 어필 — 매번 랜덤 문구 */}
        {isExecutable && staticMessage && (
          <p className="text-xs text-brand mt-3 font-medium">
            {executableMsg}
          </p>
        )}
      </div>
    </div>
  );
}
