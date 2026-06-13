import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/dio_client.dart';
import '../../data/sources/member_api.dart';

/// 회원 UUID를 SharedPreferences에 저장·관리하는 AsyncNotifier.
///
/// 앱 시작 시 저장된 UUID를 읽음.
/// UUID 없으면 /members/register 호출 후 저장.
class MemberStore extends AsyncNotifier<String?> {
  static const _kMemberUuid = 'member_uuid';
  static const _kNickname = 'member_nickname';

  @override
  Future<String?> build() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kMemberUuid);
  }

  /// UUID 반환. 없으면 서버 등록 후 반환.
  Future<String> getOrRegister() async {
    final existing = await future;
    if (existing != null) return existing;
    return _register();
  }

  Future<String> _register() async {
    final dio = ref.read(dioProvider);
    final client = MemberApiClient(dio);
    final response = await client.register();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kMemberUuid, response.memberUuid);
    await prefs.setString(_kNickname, response.nickname);

    state = AsyncData(response.memberUuid);
    return response.memberUuid;
  }

  /// 캐시된 닉네임 조회 (로컬 저장값).
  Future<String?> getCachedNickname() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kNickname);
  }
}

final memberStoreProvider = AsyncNotifierProvider<MemberStore, String?>(
  MemberStore.new,
);
