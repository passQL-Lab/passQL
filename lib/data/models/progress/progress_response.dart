import 'package:freezed_annotation/freezed_annotation.dart';
import 'readiness_response.dart';

part 'progress_response.freezed.dart';
part 'progress_response.g.dart';

/// GET /progress 응답.
/// correctRate: 0.0~1.0 (마지막 시도 기준)
/// streakDays: 연속 학습 일수
@freezed
class ProgressResponse with _$ProgressResponse {
  const factory ProgressResponse({
    required int solvedCount,
    required double correctRate,
    required int streakDays,
    ReadinessResponse? readiness,
  }) = _ProgressResponse;

  factory ProgressResponse.fromJson(Map<String, dynamic> json) =>
      _$ProgressResponseFromJson(json);
}
