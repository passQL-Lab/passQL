import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/meta/topic_tree.dart';
import '../../data/sources/meta_api.dart';

/// 토픽 목록 Provider. staleTime 없음 — 탭 진입 시 1회 로드.
/// isActive=true인 항목만 sortOrder 기준 정렬하여 반환.
final topicsProvider = FutureProvider<List<TopicTree>>((ref) async {
  final dio = ref.read(dioProvider);
  final client = MetaApiClient(dio);
  final topics = await client.getTopics();
  return topics
      .where((t) => t.isActive == true)
      .toList()
    ..sort((a, b) => (a.sortOrder ?? 0).compareTo(b.sortOrder ?? 0));
});
