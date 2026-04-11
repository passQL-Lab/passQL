import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/member/member_register_response.dart';
import '../models/member/member_me_response.dart';
import '../models/member/nickname_regenerate_response.dart';

part 'member_api.g.dart';

@RestApi()
abstract class MemberApiClient {
  factory MemberApiClient(Dio dio, {String baseUrl}) = _MemberApiClient;

  /// 최초 실행 시 UUID 발급.
  @POST('/members/register')
  Future<MemberRegisterResponse> register();

  /// 닉네임 조회.
  @GET('/members/me')
  Future<MemberMeResponse> getMe(@Query('memberUuid') String memberUuid);

  /// 닉네임 재생성.
  @POST('/members/me/regenerate-nickname')
  Future<NicknameRegenerateResponse> regenerateNickname(
    @Query('memberUuid') String memberUuid,
  );
}
