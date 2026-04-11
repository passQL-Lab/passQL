import 'package:freezed_annotation/freezed_annotation.dart';

part 'execute_result.freezed.dart';
part 'execute_result.g.dart';

/// SQL 실행 결과. errorCode가 있으면 실행 실패.
@freezed
class ExecuteResult with _$ExecuteResult {
  const factory ExecuteResult({
    String? status,
    @Default([]) List<String> columns,
    @Default([]) List<List<dynamic>> rows,
    int? rowCount,
    int? elapsedMs,
    String? errorCode,
    String? errorMessage,
  }) = _ExecuteResult;

  factory ExecuteResult.fromJson(Map<String, dynamic> json) =>
      _$ExecuteResultFromJson(json);
}
