import 'package:freezed_annotation/freezed_annotation.dart';

part 'member_me_response.freezed.dart';
part 'member_me_response.g.dart';

/// GET /members/me 응답.
@freezed
class MemberMeResponse with _$MemberMeResponse {
  const factory MemberMeResponse({
    required String memberUuid,
    required String nickname,
  }) = _MemberMeResponse;

  factory MemberMeResponse.fromJson(Map<String, dynamic> json) =>
      _$MemberMeResponseFromJson(json);
}
