import 'package:freezed_annotation/freezed_annotation.dart';

part 'nickname_regenerate_response.freezed.dart';
part 'nickname_regenerate_response.g.dart';

/// POST /members/me/regenerate-nickname 응답
@freezed
class NicknameRegenerateResponse with _$NicknameRegenerateResponse {
  const factory NicknameRegenerateResponse({
    required String nickname,
  }) = _NicknameRegenerateResponse;

  factory NicknameRegenerateResponse.fromJson(Map<String, dynamic> json) =>
      _$NicknameRegenerateResponseFromJson(json);
}
