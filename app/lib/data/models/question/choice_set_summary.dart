import 'package:freezed_annotation/freezed_annotation.dart';
import 'choice_item.dart';

part 'choice_set_summary.freezed.dart';
part 'choice_set_summary.g.dart';

/// 선택지 세트. status="OK"인 세트만 화면에 표시한다.
@freezed
class ChoiceSetSummary with _$ChoiceSetSummary {
  const factory ChoiceSetSummary({
    required String choiceSetUuid,
    required String source,
    required String status,
    bool? sandboxValidationPassed,
    String? createdAt,
    @Default([]) List<ChoiceItem> items,
  }) = _ChoiceSetSummary;

  factory ChoiceSetSummary.fromJson(Map<String, dynamic> json) =>
      _$ChoiceSetSummaryFromJson(json);
}
