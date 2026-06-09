import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/meta/topic_tree.dart';

part 'meta_api.g.dart';

@RestApi()
abstract class MetaApiClient {
  factory MetaApiClient(Dio dio, {String baseUrl}) = _MetaApiClient;

  /// 토픽 트리 전체 조회. isActive=true인 항목만 화면에 표시.
  @GET('/meta/topics')
  Future<List<TopicTree>> getTopics();
}
