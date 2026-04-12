import { useEffect, useRef } from "react";

// 단어 단위 fade-in 애니메이션 — AI 생성 텍스트 특유의 순차 출현 효과
// text가 바뀔 때마다 컨테이너를 초기화하고 재실행한다
function animateWords(container: HTMLElement, text: string, startDelay = 200) {
  container.innerHTML = "";
  // 공백과 단어를 모두 토큰으로 분리해 원본 줄바꿈·공백 구조 유지
  const tokens = text.split(/(\s+)/);
  tokens.forEach((token) => {
    if (/^\s+$/.test(token)) {
      container.appendChild(document.createTextNode(token));
      return;
    }
    const span = document.createElement("span");
    span.className = "ai-word";
    span.textContent = token;
    container.appendChild(span);
  });

  const words = container.querySelectorAll<HTMLElement>(".ai-word");
  words.forEach((w, i) => {
    setTimeout(() => {
      w.classList.add("ai-word-visible");
    }, startDelay + i * 55);
  });
}

interface UseAiTextOptions {
  /** 애니메이션 시작 전 대기 시간(ms). 기본값 200 */
  startDelay?: number;
}

/**
 * AI 생성 텍스트를 단어 단위로 순차 fade-in 하는 훅.
 *
 * 반환된 ref를 텍스트를 렌더링할 <p> 또는 <span>에 연결하면
 * text가 처음 주어지거나 변경될 때마다 애니메이션이 재실행된다.
 *
 * @example
 * const ref = useAiText(comment);
 * return <p ref={ref} className="text-sm leading-relaxed" />;
 */
export function useAiText<T extends HTMLElement = HTMLParagraphElement>(
  text: string | null | undefined,
  { startDelay = 200 }: UseAiTextOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!text || !ref.current) return;
    animateWords(ref.current, text, startDelay);
  }, [text, startDelay]);

  return ref;
}
