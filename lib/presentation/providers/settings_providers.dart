import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/dio_client.dart';
import '../../data/sources/member_api.dart';
import 'member_store.dart';

/// 설정 화면 데이터 집계 모델
class SettingsData {
  final String memberUuid;
  final String nickname;
  final String version;

  const SettingsData({
    required this.memberUuid,
    required this.nickname,
    required this.version,
  });
}

/// 설정 화면 초기 데이터 로딩 Provider
///
/// UUID는 MemberStore에서, 닉네임은 GET /members/me, 버전은 PackageInfo에서 조회.
final settingsDataProvider = FutureProvider<SettingsData>((ref) async {
  final memberUuid =
      await ref.watch(memberStoreProvider.notifier).getOrRegister();

  final dio = ref.read(dioProvider);
  final client = MemberApiClient(dio);

  final results = await Future.wait([
    client.getMe(memberUuid),
    PackageInfo.fromPlatform(),
  ]);

  final me = results[0] as dynamic;
  final info = results[1] as PackageInfo;

  return SettingsData(
    memberUuid: memberUuid,
    nickname: me.nickname as String,
    version: '${info.version}-MVP',
  );
});

/// 닉네임 재생성 Notifier
///
/// regenerate() 호출 시 서버에서 새 닉네임 받아 SharedPreferences 업데이트.
class NicknameNotifier extends AsyncNotifier<String?> {
  @override
  Future<String?> build() async {
    // 초기값은 캐시에서 로드
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('member_nickname');
  }

  Future<void> regenerate() async {
    final memberUuid =
        await ref.read(memberStoreProvider.notifier).getOrRegister();
    final dio = ref.read(dioProvider);
    final client = MemberApiClient(dio);

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final response = await client.regenerateNickname(memberUuid);
      // 로컬 캐시 업데이트
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('member_nickname', response.nickname);
      return response.nickname;
    });
  }
}

final nicknameNotifierProvider =
    AsyncNotifierProvider<NicknameNotifier, String?>(NicknameNotifier.new);
