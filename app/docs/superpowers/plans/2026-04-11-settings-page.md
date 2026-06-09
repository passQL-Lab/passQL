# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디바이스 ID(복사), 닉네임(재생성), 버전 정보를 보여주는 설정 화면 구현

**Architecture:** MemberStore에서 UUID를 읽고, GET /members/me로 닉네임을 조회. 닉네임 재생성은 POST /members/me/regenerate-nickname 호출 후 로컬 캐시 업데이트. 버전은 package_info_plus로 조회.

**Tech Stack:** Flutter, Riverpod (FutureProvider), Retrofit, freezed, package_info_plus, flutter/services (Clipboard)

---

## File Map

| 파일 | 역할 |
|------|------|
| `lib/data/models/member/nickname_regenerate_response.dart` | POST regenerate 응답 freezed 모델 |
| `lib/data/sources/member_api.dart` | regenerateNickname() 메서드 추가 |
| `lib/presentation/providers/settings_providers.dart` | 닉네임 조회 + 재생성 + 버전 Provider |
| `lib/presentation/pages/settings/settings_page.dart` | 설정 화면 UI |

---

## Task 1: NicknameRegenerateResponse 모델 추가

**Files:**
- Create: `lib/data/models/member/nickname_regenerate_response.dart`

- [ ] **Step 1: 모델 파일 생성**

```dart
// lib/data/models/member/nickname_regenerate_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'nickname_regenerate_response.freezed.dart';
part 'nickname_regenerate_response.g.dart';

/// POST /members/me/regenerate-nickname 응답
@freezed
class NicknameRegenerateResponse with _$NicknameRegenerateResponse {
  const factory NicknameRegenerateResponse({
    required String nickname,
  }) = _NicknameRegenerateResponse;

  factory NicknameRegenerateResponse.fromJson(Map<String, dynamic> json) =>
      _$NicknameRegenerateResponseFromJson(json);
}
```

- [ ] **Step 2: member_api.dart에 regenerateNickname 추가**

`lib/data/sources/member_api.dart`를 다음과 같이 수정:

```dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/member/member_register_response.dart';
import '../models/member/member_me_response.dart';
import '../models/member/nickname_regenerate_response.dart';

part 'member_api.g.dart';

@RestApi()
abstract class MemberApiClient {
  factory MemberApiClient(Dio dio, {String baseUrl}) = _MemberApiClient;

  /// 최초 실행 시 UUID 발급
  @POST('/members/register')
  Future<MemberRegisterResponse> register();

  /// 닉네임 조회
  @GET('/members/me')
  Future<MemberMeResponse> getMe(@Query('memberUuid') String memberUuid);

  /// 닉네임 재생성
  @POST('/members/me/regenerate-nickname')
  Future<NicknameRegenerateResponse> regenerateNickname(
    @Query('memberUuid') String memberUuid,
  );
}
```

- [ ] **Step 3: 코드 생성 실행**

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

생성 확인:
- `lib/data/models/member/nickname_regenerate_response.freezed.dart`
- `lib/data/models/member/nickname_regenerate_response.g.dart`
- `lib/data/sources/member_api.g.dart` 재생성

- [ ] **Step 4: 커밋**

```bash
git add lib/data/models/member/nickname_regenerate_response.dart \
        lib/data/models/member/nickname_regenerate_response.freezed.dart \
        lib/data/models/member/nickname_regenerate_response.g.dart \
        lib/data/sources/member_api.dart \
        lib/data/sources/member_api.g.dart
git commit -m "feat: NicknameRegenerateResponse 모델 + regenerateNickname API 추가"
```

---

## Task 2: Settings Provider 구현

**Files:**
- Create: `lib/presentation/providers/settings_providers.dart`

- [ ] **Step 1: settings_providers.dart 생성**

```dart
// lib/presentation/providers/settings_providers.dart
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
```

- [ ] **Step 2: 커밋**

```bash
git add lib/presentation/providers/settings_providers.dart
git commit -m "feat: settings_providers — 설정 데이터 로딩 + 닉네임 재생성 Notifier"
```

---

## Task 3: Settings Page UI 구현

**Files:**
- Modify: `lib/presentation/pages/settings/settings_page.dart`

- [ ] **Step 1: settings_page.dart 전체 구현**

```dart
// lib/presentation/pages/settings/settings_page.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../providers/settings_providers.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(settingsDataProvider);
    final nicknameAsync = ref.watch(nicknameNotifierProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('설정', style: AppTextStyles.heading_24),
              const SizedBox(height: 24),
              // 정보 카드
              settingsAsync.when(
                loading: () => const _InfoCardSkeleton(),
                error: (_, __) => const SizedBox.shrink(),
                data: (data) {
                  // 닉네임은 nicknameNotifier 상태 우선 (재생성 반영)
                  final nickname = nicknameAsync.valueOrNull ?? data.nickname;
                  final isRegenerating = nicknameAsync.isLoading;

                  return _InfoCard(
                    memberUuid: data.memberUuid,
                    nickname: nickname,
                    version: data.version,
                    isRegenerating: isRegenerating,
                    onCopyUuid: () {
                      Clipboard.setData(ClipboardData(text: data.memberUuid));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            '디바이스 ID가 복사되었습니다.',
                            style: AppTextStyles.paragraph_14
                                .copyWith(color: Colors.white),
                          ),
                          backgroundColor: AppColors.toastBg,
                          behavior: SnackBarBehavior.floating,
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                    onRegenerateNickname: () =>
                        ref.read(nicknameNotifierProvider.notifier).regenerate(),
                  );
                },
              ),
              const SizedBox(height: 40),
              // 하단 푸터
              const _Footer(),
            ],
          ),
        ),
      ),
    );
  }
}

/// 정보 카드 (디바이스 ID / 닉네임 / 버전)
class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.memberUuid,
    required this.nickname,
    required this.version,
    required this.isRegenerating,
    required this.onCopyUuid,
    required this.onRegenerateNickname,
  });

  final String memberUuid;
  final String nickname;
  final String version;
  final bool isRegenerating;
  final VoidCallback onCopyUuid;
  final VoidCallback onRegenerateNickname;

  @override
  Widget build(BuildContext context) {
    // UUID는 앞 19자 + "..." 로 축약
    final truncatedUuid = memberUuid.length > 19
        ? '${memberUuid.substring(0, 19)}...'
        : memberUuid;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        children: [
          _InfoRow(
            label: '디바이스 ID',
            value: truncatedUuid,
            valueStyle: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textPrimary),
            action: IconButton(
              icon: const FaIcon(FontAwesomeIcons.copy, size: 16),
              color: AppColors.textCaption,
              onPressed: onCopyUuid,
            ),
          ),
          const Divider(height: 1, color: AppColors.borderDefault),
          _InfoRow(
            label: '닉네임',
            value: nickname,
            valueStyle: AppTextStyles.label_16
                .copyWith(color: AppColors.textPrimary),
            action: isRegenerating
                ? const SizedBox(
                    width: 40,
                    height: 40,
                    child: Center(
                      child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.textCaption,
                        ),
                      ),
                    ),
                  )
                : IconButton(
                    icon: const FaIcon(FontAwesomeIcons.arrowsRotate, size: 16),
                    color: AppColors.textCaption,
                    onPressed: onRegenerateNickname,
                  ),
          ),
          const Divider(height: 1, color: AppColors.borderDefault),
          _InfoRow(
            label: '버전',
            value: version,
            valueStyle: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textCaption),
            action: null,
          ),
        ],
      ),
    );
  }
}

/// 카드 내 단일 행
class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    required this.valueStyle,
    required this.action,
  });

  final String label;
  final String value;
  final TextStyle valueStyle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 4, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTextStyles.tag_12
                      .copyWith(color: AppColors.textCaption),
                ),
                const SizedBox(height: 4),
                Text(value, style: valueStyle),
              ],
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}

/// 로딩 스켈레톤 — 카드 자리 유지
class _InfoCardSkeleton extends StatelessWidget {
  const _InfoCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderDefault),
      ),
    );
  }
}

/// passQL 브랜드 푸터
class _Footer extends StatelessWidget {
  const _Footer();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Center(
          child: RichText(
            text: TextSpan(
              style: AppTextStyles.label_16
                  .copyWith(color: AppColors.textPrimary),
              children: const [
                TextSpan(text: 'pass'),
                TextSpan(
                  text: 'QL',
                  style: TextStyle(color: AppColors.brandIndigo),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Center(
          child: Text(
            '© 2026 passQL. All rights reserved.',
            style: AppTextStyles.tag_12
                .copyWith(color: AppColors.textCaption),
          ),
        ),
      ],
    );
  }
}
```

- [ ] **Step 2: flutter analyze 실행**

```bash
flutter analyze lib/presentation/pages/settings/settings_page.dart \
               lib/presentation/providers/settings_providers.dart
```

경고/에러 없으면 통과.

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/pages/settings/settings_page.dart
git commit -m "feat: 설정 화면 구현 — 디바이스 ID 복사, 닉네임 재생성, 버전 표시"
```

---

## Self-Review

**Spec coverage:**
- [x] 디바이스 ID 표시 + 복사 아이콘
- [x] 닉네임 표시 + 재생성 아이콘 (로딩 인디케이터 포함)
- [x] 버전 표시 (아이콘 없음)
- [x] passQL 로고 + copyright 푸터
- [x] 카드 구분선 (Divider)

**Placeholder scan:** 없음 — 모든 코드 완성.

**Type consistency:**
- `SettingsData.nickname` → `_InfoCard.nickname` → `_InfoRow.value` 일관.
- `nicknameNotifierProvider` → `NicknameNotifier` → `regenerate()` 일관.
- `regenerateNickname(memberUuid)` — member_api.dart Query param과 일치.
