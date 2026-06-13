import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/home/greeting_response.dart';

part 'home_api.g.dart';

@RestApi()
abstract class HomeApiClient {
  factory HomeApiClient(Dio dio, {String baseUrl}) = _HomeApiClient;

  /// 홈 화면 인사 메시지.
  @GET('/home/greeting')
  Future<GreetingResponse> getGreeting(@Query('memberUuid') String memberUuid);
}
