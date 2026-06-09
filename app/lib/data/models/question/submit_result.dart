import 'package:freezed_annotation/freezed_annotation.dart';
import 'execute_result.dart';

part 'submit_result.freezed.dart';
part 'submit_result.g.dart';

/// 제출 결과. ResultPage로 navigate state에 담아 전달.
@freezed
class SubmitResult with _$SubmitResult {
  const factory SubmitResult({
    required bool isCorrect,
    String? correctKey,
    String? rationale,
    ExecuteResult? selectedResult,
    ExecuteResult? correctResult,
    String? correctSql,
    String? selectedSql,
  }) = _SubmitResult;

  factory SubmitResult.fromJson(Map<String, dynamic> json) =>
      _$SubmitResultFromJson(json);
}
