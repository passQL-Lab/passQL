import { useState, useEffect } from "react";
import { getRandomMessage } from "../constants/microcopy";

interface LoadingOverlayProps {
  readonly topicName: string;
}

export default function LoadingOverlay({ topicName }: LoadingOverlayProps) {
  const [message, setMessage] = useState(() => getRandomMessage(topicName));

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(getRandomMessage(topicName));
    }, 3000);
    return () => clearInterval(interval);
  }, [topicName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-card rounded-2xl p-10 text-center max-w-[360px] w-[90%]">
        <div className="w-12 h-12 border-3 border-accent-light border-t-brand rounded-full animate-spin mx-auto mb-5" />
        <span className="inline-block bg-accent-light text-brand text-sm font-medium px-3.5 py-1 rounded-full mb-4">
          {topicName}
        </span>
        <p className="text-body">{message}</p>
        <p className="text-xs text-text-caption mt-2">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
