import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_result.freezed.dart';
part 'ai_result.g.dart';

/// AI 해설 텍스트 응답.
@freezed
class AiResult with _$AiResult {
  const factory AiResult({
    required String text,
    int? promptVersion,
  }) = _AiResult;

  factory AiResult.fromJson(Map<String, dynamic> json) =>
      _$AiResultFromJson(json);
}
