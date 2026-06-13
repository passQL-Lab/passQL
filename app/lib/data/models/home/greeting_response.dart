import 'package:freezed_annotation/freezed_annotation.dart';

part 'greeting_response.freezed.dart';
part 'greeting_response.g.dart';

/// GET /home/greeting 응답.
/// message에 {nickname} 플레이스홀더 포함.
/// messageType: GENERAL | COUNTDOWN | URGENT | EXAM_DAY
@freezed
class GreetingResponse with _$GreetingResponse {
  const factory GreetingResponse({
    required String nickname,
    required String message,
    required String messageType,
  }) = _GreetingResponse;

  factory GreetingResponse.fromJson(Map<String, dynamic> json) =>
      _$GreetingResponseFromJson(json);
}
