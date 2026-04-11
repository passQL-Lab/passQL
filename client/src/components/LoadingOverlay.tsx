import { useState, useEffect } from "react";
import { getRandomMessage } from "../constants/microcopy";

interface LoadingOverlayProps {
  readonly topicName: string;
  /** 전달 시 랜덤 메시지 대신 고정 메시지 표시 (채점 중 등) */
  readonly staticMessage?: string;
  /** staticMessage와 함께 표시할 보조 텍스트 */
  readonly subMessage?: string;
}

export default function LoadingOverlay({ topicName, staticMessage, subMessage }: LoadingOverlayProps) {
  const [message, setMessage] = useState(() => getRandomMessage(topicName));

  useEffect(() => {
    if (staticMessage) return;
    const interval = setInterval(() => {
      setMessage(getRandomMessage(topicName));
    }, 3000);
    return () => clearInterval(interval);
  }, [topicName, staticMessage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-card rounded-2xl p-10 text-center max-w-[360px] w-[90%]">
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
      </div>
    </div>
  );
}
