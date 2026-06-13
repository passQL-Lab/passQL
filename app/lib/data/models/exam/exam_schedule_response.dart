import 'package:freezed_annotation/freezed_annotation.dart';

part 'exam_schedule_response.freezed.dart';
part 'exam_schedule_response.g.dart';

/// GET /exam-schedules/selected 응답.
/// 선택된 시험 없으면 서버가 200 + null body 반환.
@freezed
class ExamScheduleResponse with _$ExamScheduleResponse {
  const factory ExamScheduleResponse({
    required String examScheduleUuid,
    required String certType,
    required int round,
    required String examDate,
    required bool isSelected,
  }) = _ExamScheduleResponse;

  factory ExamScheduleResponse.fromJson(Map<String, dynamic> json) =>
      _$ExamScheduleResponseFromJson(json);
}
