import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/exam/exam_schedule_response.dart';

part 'exam_schedule_api.g.dart';

@RestApi()
abstract class ExamScheduleApiClient {
  factory ExamScheduleApiClient(Dio dio, {String baseUrl}) = _ExamScheduleApiClient;

  /// 선택된 시험 일정. 없으면 200 + null body.
  @GET('/exam-schedules/selected')
  Future<ExamScheduleResponse?> getSelectedSchedule();
}
