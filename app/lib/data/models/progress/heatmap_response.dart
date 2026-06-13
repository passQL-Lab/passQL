import 'package:freezed_annotation/freezed_annotation.dart';

part 'heatmap_response.freezed.dart';
part 'heatmap_response.g.dart';

/// 히트맵 단일 날짜 엔트리.
@freezed
class HeatmapEntry with _$HeatmapEntry {
  const factory HeatmapEntry({
    required String date,
    required int solvedCount,
    required int correctCount,
  }) = _HeatmapEntry;

  factory HeatmapEntry.fromJson(Map<String, dynamic> json) =>
      _$HeatmapEntryFromJson(json);
}

/// GET /progress/heatmap 응답.
@freezed
class HeatmapResponse with _$HeatmapResponse {
  const factory HeatmapResponse({
    @Default([]) List<HeatmapEntry> entries,
  }) = _HeatmapResponse;

  factory HeatmapResponse.fromJson(Map<String, dynamic> json) =>
      _$HeatmapResponseFromJson(json);
}
