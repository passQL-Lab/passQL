import 'package:freezed_annotation/freezed_annotation.dart';

part 'member_register_response.freezed.dart';
part 'member_register_response.g.dart';

/// POST /members/register 응답.
@freezed
class MemberRegisterResponse with _$MemberRegisterResponse {
  const factory MemberRegisterResponse({
    required String memberUuid,
    required String nickname,
  }) = _MemberRegisterResponse;

  factory MemberRegisterResponse.fromJson(Map<String, dynamic> json) =>
      _$MemberRegisterResponseFromJson(json);
}
