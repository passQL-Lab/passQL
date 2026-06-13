import 'package:freezed_annotation/freezed_annotation.dart';

part 'choice_item.freezed.dart';
part 'choice_item.g.dart';

/// 개별 선택지. kind="SQL"이면 body가 SQL 코드, kind="TEXT"면 일반 텍스트.
@freezed
class ChoiceItem with _$ChoiceItem {
  const factory ChoiceItem({
    required String key,
    required String kind,
    required String body,
    bool? isCorrect,
    String? rationale,
    int? sortOrder,
  }) = _ChoiceItem;

  factory ChoiceItem.fromJson(Map<String, dynamic> json) =>
      _$ChoiceItemFromJson(json);
}
