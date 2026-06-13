import 'choice_item.dart';

/// SSE 이벤트 계층. 코드 생성 없이 수동 파싱 사용.
sealed class SseEvent {}

/// 선택지 생성 진행 중 상태 메시지.
class SseStatusEvent extends SseEvent {
  final String message;
  SseStatusEvent(this.message);
}

/// 선택지 생성 완료. choices와 choiceSetId를 포함.
class SseCompleteEvent extends SseEvent {
  final List<ChoiceItem> choices;
  final String choiceSetId;
  SseCompleteEvent(this.choices, this.choiceSetId);
}

/// 선택지 생성 실패. retryable=true면 재시도 버튼 표시.
class SseErrorEvent extends SseEvent {
  final String code;
  final bool retryable;
  SseErrorEvent(this.code, this.retryable);
}
