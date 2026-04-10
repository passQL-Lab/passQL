import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/home/today_question_response.dart';
import '../models/home/recommendations_response.dart';

part 'question_api.g.dart';

@RestApi()
abstract class QuestionApiClient {
  factory QuestionApiClient(Dio dio, {String baseUrl}) = _QuestionApiClient;

  /// 오늘의 데일리 챌린지 문제.
  @GET('/questions/today')
  Future<TodayQuestionResponse> getTodayQuestion(
    @Query('memberUuid') String? memberUuid,
  );

  /// 랜덤 추천 문제 N개.
  @GET('/questions/recommendations')
  Future<RecommendationsResponse> getRecommendations(
    @Query('size') int? size,
    @Query('excludeQuestionUuid') String? excludeQuestionUuid,
  );
}
