import { apiFetch, BASE_URL } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  TodayQuestionResponse,
  RecommendationsResponse,
  SseStatusEvent,
  SseErrorEvent,
  ChoiceSetGenerateResponse,
} from "../types/api";

interface QuestionListParams {
  readonly page?: number;
  readonly size?: number;
  readonly topic?: string;
  readonly subtopic?: string;
  readonly difficulty?: number;
  readonly mode?: string;
}

export function fetchQuestions(
  params: QuestionListParams = {},
): Promise<Page<QuestionSummary>> {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.size != null) query.set("size", String(params.size));
  if (params.topic) query.set("topic", params.topic);
  if (params.subtopic) query.set("subtopic", params.subtopic);
  if (params.difficulty != null)
    query.set("difficulty", String(params.difficulty));
  if (params.mode) query.set("mode", params.mode);

  return apiFetch(`/questions?${query}`);
}

export function fetchQuestion(questionUuid: string): Promise<QuestionDetail> {
  return apiFetch(`/questions/${questionUuid}`);
}

export function fetchTodayQuestion(memberUuid?: string): Promise<TodayQuestionResponse> {
  const query = new URLSearchParams();
  if (memberUuid) query.set("memberUuid", memberUuid);
  const qs = query.toString();
  return apiFetch(`/questions/today${qs ? `?${qs}` : ""}`);
}

export function fetchRecommendations(
  size?: number,
  excludeQuestionUuid?: string,
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (size != null) query.set("size", String(size));
  if (excludeQuestionUuid) query.set("excludeQuestionUuid", excludeQuestionUuid);
  const qs = query.toString();
  return apiFetch(`/questions/recommendations${qs ? `?${qs}` : ""}`);
}

// SSE로 AI 선택지를 생성하고 choiceSetId를 받는다.
// EventSource는 커스텀 헤더를 지원하지 않으므로 fetch + ReadableStream 방식 사용.
// 반환값: cleanup 함수 (컴포넌트 unmount 시 호출해 스트림을 중단).
export function generateChoices(
  questionUuid: string,
  callbacks: {
    readonly onStatus: (event: SseStatusEvent) => void;
    readonly onComplete: (response: ChoiceSetGenerateResponse) => void;
    readonly onError: (event: SseErrorEvent) => void;
  },
): () => void {
  const abortController = new AbortController();

  (async () => {
    // complete/error 이벤트를 정상 수신했는지 추적 — 스트림 종료 후 판단에 사용
    let receivedTerminalEvent = false;

    try {
      const response = await fetch(
        `${BASE_URL}/questions/${questionUuid}/generate-choices`,
        {
          method: "POST",
          headers: {
            "X-Member-UUID": getMemberUuid(),
            Accept: "text/event-stream",
          },
          signal: abortController.signal,
        },
      );

      // HTTP 에러 응답 처리 (4xx/5xx)
      if (!response.ok) {
        callbacks.onError({ code: `HTTP_${response.status}`, message: `서버 오류 (${response.status})`, retryable: response.status >= 500 });
        return;
      }

      if (!response.body) {
        callbacks.onError({ code: "NO_BODY", message: "응답 본문이 없습니다", retryable: true });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // PARSE_ERROR 발생 시 외부 while 루프까지 종료하기 위한 플래그
      let abortProcessing = false;

      // SSE 청크 파싱 헬퍼 — buffer를 \n\n으로 분리해 이벤트를 순차 처리
      const processBuffer = () => {
        const chunks = buffer.split("\n\n");
        // 마지막 항목은 아직 완성되지 않은 청크일 수 있으므로 다시 버퍼에 보관
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const eventMatch = chunk.match(/^event: (\w+)/m);
          const dataMatch = chunk.match(/^data: (.+)/m);
          if (!eventMatch || !dataMatch) continue;

          const eventName = eventMatch[1];
          // 잘못된 JSON을 받으면 루프 전체를 중단하고 에러로 전환
          let data: unknown;
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            receivedTerminalEvent = true;
            abortProcessing = true; // while 루프도 종료
            callbacks.onError({ code: "PARSE_ERROR", message: "잘못된 응답 형식", retryable: false });
            return;
          }

          if (eventName === "status") {
            callbacks.onStatus(data as SseStatusEvent);
          } else if (eventName === "complete") {
            receivedTerminalEvent = true;
            callbacks.onComplete(data as ChoiceSetGenerateResponse);
          } else if (eventName === "error") {
            receivedTerminalEvent = true;
            callbacks.onError(data as SseErrorEvent);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (abortProcessing) break;

        if (done) {
          // done: true와 함께 마지막 value가 함께 도착하는 경우 처리
          // (Spring SseEmitter.complete() 직전 이벤트와 스트림 종료가 같은 청크로 오면 여기서 수신)
          if (value) {
            buffer += decoder.decode(value, { stream: false });
          }
          // 버퍼에 남은 마지막 이벤트 처리
          // (서버가 emitter.complete()를 호출하면 complete 이벤트가 마지막 청크로 남을 수 있음)
          if (buffer.trim()) {
            buffer += "\n\n"; // 청크 구분자 강제 추가
            processBuffer();
          }
          // processBuffer에서 PARSE_ERROR가 발생한 경우 abortProcessing=true이므로 STREAM_CLOSED 중복 방지
          // complete/error 이벤트 없이 스트림이 닫힌 경우 — 서버 측 조용한 종료
          // AbortError로 cleanup한 경우가 아닐 때만 에러 처리
          if (!receivedTerminalEvent && !abortProcessing && !abortController.signal.aborted) {
            callbacks.onError({ code: "STREAM_CLOSED", message: "선택지 생성이 중단되었습니다", retryable: true });
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }
    } catch (err) {
      // AbortError는 정상 cleanup이므로 무시
      if (err instanceof Error && err.name !== "AbortError") {
        callbacks.onError({ code: "STREAM_ERROR", message: err.message, retryable: true });
      }
    }
  })();

  return () => abortController.abort();
}

export function submitAnswer(
  questionUuid: string,
  choiceSetId: string,
  selectedChoiceKey: string,
): Promise<SubmitResult> {
  return apiFetch(`/questions/${questionUuid}/submit`, {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ choiceSetId, selectedChoiceKey }),
  });
}

export function executeChoice(
  questionUuid: string,
  sql: string,
): Promise<ExecuteResult> {
  return apiFetch(`/questions/${questionUuid}/execute`, {
    method: "POST",
    body: JSON.stringify({ sql }),
  });
}
