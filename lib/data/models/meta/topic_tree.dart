import 'package:freezed_annotation/freezed_annotation.dart';

part 'topic_tree.freezed.dart';
part 'topic_tree.g.dart';

/// 서브토픽 항목.
@freezed
class SubtopicItem with _$SubtopicItem {
  const factory SubtopicItem({
    required String code,
    required String displayName,
    int? sortOrder,
    bool? isActive,
  }) = _SubtopicItem;

  factory SubtopicItem.fromJson(Map<String, dynamic> json) =>
      _$SubtopicItemFromJson(json);
}

/// 토픽 트리. isActive=true인 항목만 화면에 표시.
@freezed
class TopicTree with _$TopicTree {
  const factory TopicTree({
    required String topicUuid,
    required String code,
    required String displayName,
    int? sortOrder,
    bool? isActive,
    @Default([]) List<SubtopicItem> subtopics,
  }) = _TopicTree;

  factory TopicTree.fromJson(Map<String, dynamic> json) =>
      _$TopicTreeFromJson(json);
}
