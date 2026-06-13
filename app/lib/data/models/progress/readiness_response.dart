import 'package:freezed_annotation/freezed_annotation.dart';

part 'readiness_response.freezed.dart';
part 'readiness_response.g.dart';

/// 합격 준비도 블록.
/// score = accuracy × coverage × recency (0.0~1.0)
/// toneKey: NO_EXAM | ONBOARDING | POST_EXAM | TODAY | SPRINT | PUSH | STEADY | EARLY
@freezed
class ReadinessResponse with _$ReadinessResponse {
  const factory ReadinessResponse({
    required double score,
    required double accuracy,
    required double coverage,
    required double recency,
    String? lastStudiedAt,
    required int recentAttemptCount,
    required int coveredTopicCount,
    required int activeTopicCount,
    int? daysUntilExam,
    required String toneKey,
  }) = _ReadinessResponse;

  factory ReadinessResponse.fromJson(Map<String, dynamic> json) =>
      _$ReadinessResponseFromJson(json);
}
