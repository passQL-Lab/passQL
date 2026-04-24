import { apiFetch, BASE_URL } from "./client";
import { getAccessToken } from "../stores/authStore";
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

export function fetchTodayQuestion(): Promise<TodayQuestionResponse> {
  return apiFetch("/questions/today");
}

export function fetchRecommendations(
  size?: number,
  excludeQuestionUuids?: string[],
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (size != null) query.set("size", String(size));
  // 동일 키 반복 append — Spring @RequestParam List<String> 자동 처리
  excludeQuestionUuids?.forEach((uuid) => query.append("excludeQuestionUuids", uuid));
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
    let receivedTerminalEvent = false;

    try {
      const accessToken = getAccessToken();
      const response = await fetch(
        `${BASE_URL}/questions/${questionUuid}/generate-choices`,
        {
          method: "POST",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            Accept: "text/event-stream",
          },
          signal: abortController.signal,
        },
      );

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

      // SSE 이벤트 파싱 — RFC 8895 준수
      // Spring SseEmitter: "event:name\ndata:json\n\n" (콜론 뒤 공백 없음)
      // 브라우저 EventSource 표준: 공백 있음 — 둘 다 허용
      // 반환값: true = 루프 중단해야 하는 terminal 이벤트 처리됨
      const parseAndDispatch = (raw: string): boolean => {
        // \r\n, \r, \n 모두 \n으로 정규화
        const block = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        let eventName = "";
        const dataLines: string[] = [];

        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        console.debug("[SSE] parseAndDispatch: event=", eventName, "dataLines=", dataLines.length);

        if (!eventName || dataLines.length === 0) {
          console.debug("[SSE] 이벤트 무시: event 또는 data 없음, raw=", JSON.stringify(raw));
          return false;
        }

        const rawData = dataLines.join("\n");
        let data: unknown;
        try {
          data = JSON.parse(rawData);
        } catch {
          // JSON 파싱 실패 — PARSE_ERROR를 terminal로 처리 후 루프 중단
          console.error("[SSE] PARSE_ERROR: rawData=", rawData);
          receivedTerminalEvent = true;
          callbacks.onError({ code: "PARSE_ERROR", message: "잘못된 응답 형식", retryable: false });
          return true;
        }

        if (eventName === "status") {
          console.debug("[SSE] status 수신:", data);
          callbacks.onStatus(data as SseStatusEvent);
        } else if (eventName === "complete") {
          console.debug("[SSE] complete 수신 → receivedTerminalEvent=true");
          receivedTerminalEvent = true;
          callbacks.onComplete(data as ChoiceSetGenerateResponse);
          return true; // complete 후 스트림 남은 데이터를 읽을 필요 없음
        } else if (eventName === "error") {
          console.debug("[SSE] error 수신 → receivedTerminalEvent=true, data=", data);
          receivedTerminalEvent = true;
          callbacks.onError(data as SseErrorEvent);
          return true;
        } else {
          console.debug("[SSE] 알 수 없는 이벤트 타입 무시:", eventName);
        }
        return false;
      };

      // 버퍼에서 완성된 이벤트 블록(\n\n 구분)을 꺼내 순차 처리
      // 반환값: true = terminal 이벤트 처리됨 → while 루프 중단 신호
      const flushBuffer = (): boolean => {
        const blocks = buffer.split(/\n\n/);
        buffer = blocks.pop() ?? ""; // 마지막은 미완성 청크일 수 있으므로 보관
        console.debug("[SSE] flushBuffer: blocks=", blocks.length, "remainder=", JSON.stringify(buffer));
        for (const block of blocks) {
          if (!block.trim()) continue;
          const shouldStop = parseAndDispatch(block);
          if (shouldStop) return true;
        }
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();
        console.debug("[SSE] read: done=", done, "valueBytes=", value?.byteLength ?? 0);

        if (done) {
          // 스트림 종료 — 버퍼에 남은 마지막 이벤트까지 처리
          if (value) buffer += decoder.decode(value, { stream: false });
          console.debug("[SSE] done: remaining buffer=", JSON.stringify(buffer), "receivedTerminal=", receivedTerminalEvent);
          if (buffer.trim()) {
            buffer += "\n\n";
            flushBuffer();
          }
          // complete/error 없이 닫힌 경우 (서버 비정상 종료, abort 제외)
          if (!receivedTerminalEvent && !abortController.signal.aborted) {
            console.error("[SSE] STREAM_CLOSED: terminal 이벤트 없이 스트림 종료");
            callbacks.onError({ code: "STREAM_CLOSED", message: "선택지 생성이 중단되었습니다", retryable: true });
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const shouldStop = flushBuffer();
        if (shouldStop) break;
      }
    } catch (err) {
      // AbortError는 cleanup에 의한 정상 중단 — 에러 처리 불필요
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
  sessionUuid: string,
): Promise<SubmitResult> {
  return apiFetch(`/questions/${questionUuid}/submit`, {
    method: "POST",
    body: JSON.stringify({ choiceSetId, selectedChoiceKey, sessionUuid }),
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
