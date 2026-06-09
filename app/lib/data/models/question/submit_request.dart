import 'package:freezed_annotation/freezed_annotation.dart';

part 'submit_request.freezed.dart';
part 'submit_request.g.dart';

@freezed
class SubmitRequest with _$SubmitRequest {
  const factory SubmitRequest({
    required String choiceSetId,
    required String selectedChoiceKey,
  }) = _SubmitRequest;
  factory SubmitRequest.fromJson(Map<String, dynamic> json) =>
      _$SubmitRequestFromJson(json);
}
