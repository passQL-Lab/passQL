import 'package:freezed_annotation/freezed_annotation.dart';

part 'execute_request.freezed.dart';
part 'execute_request.g.dart';

@freezed
class ExecuteRequest with _$ExecuteRequest {
  const factory ExecuteRequest({required String sql}) = _ExecuteRequest;
  factory ExecuteRequest.fromJson(Map<String, dynamic> json) =>
      _$ExecuteRequestFromJson(json);
}
