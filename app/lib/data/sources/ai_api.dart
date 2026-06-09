import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/ai/ai_result.dart';
import '../models/ai/similar_question.dart';

part 'ai_api.g.dart';

@RestApi()
abstract class AiApiClient {
  factory AiApiClient(Dio dio, {String baseUrl}) = _AiApiClient;

  /// SQL 에러 AI 해설. body: { questionUuid, sql, errorMessage }
  @POST('/ai/explain-error')
  Future<AiResult> explainError(
    @Header('X-Member-UUID') String memberUuid,
    @Body() Map<String, dynamic> body,
  );

  /// 오답 AI 해설. body: { questionUuid, selectedChoiceKey }
  @POST('/ai/diff-explain')
  Future<AiResult> diffExplain(
    @Header('X-Member-UUID') String memberUuid,
    @Body() Map<String, dynamic> body,
  );

  /// 유사 문제 k개 조회.
  @GET('/ai/similar/{questionUuid}')
  Future<List<SimilarQuestion>> getSimilar(
    @Path('questionUuid') String questionUuid,
    @Query('k') int k,
  );
}
