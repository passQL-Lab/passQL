import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_comment_response.freezed.dart';
part 'ai_comment_response.g.dart';

/// GET /progress/ai-comment 응답.
/// comment: AI 생성 한국어 코멘트 (Redis 캐시 24h)
@freezed
class AiCommentResponse with _$AiCommentResponse {
  const factory AiCommentResponse({
    required String comment,
    String? generatedAt,
  }) = _AiCommentResponse;

  factory AiCommentResponse.fromJson(Map<String, dynamic> json) =>
      _$AiCommentResponseFromJson(json);
}
