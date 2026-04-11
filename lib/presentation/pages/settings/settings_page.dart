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
                error: (e, _) => Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.borderDefault),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '정보를 불러오지 못했습니다.',
                        style: AppTextStyles.paragraph_14
                            .copyWith(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: () => ref.refresh(settingsDataProvider),
                        child: Text(
                          '다시 시도',
                          style: AppTextStyles.paragraph_14
                              .copyWith(color: AppColors.brandIndigo),
                        ),
                      ),
                    ],
                  ),
                ),
                data: (data) {
                  // 닉네임은 nicknameNotifier 상태 우선 (재생성 반영)
                  final nickname = nicknameAsync.valueOrNull ?? data.nickname;
                  final isRegenerating = nicknameAsync.isLoading;

                  return _InfoCard(
                    memberUuid: data.memberUuid,
                    nickname: nickname,
                    version: data.version,
                    isRegenerating: isRegenerating,
                    onCopyUuid: () async {
                      await Clipboard.setData(
                          ClipboardData(text: data.memberUuid));
                      // async gap 이후 위젯이 unmount됐을 수 있으므로 체크
                      if (!context.mounted) return;
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
  // async 콜백 — Clipboard.setData 이후 context.mounted 체크를 위해 Future<void> 사용
  final Future<void> Function() onCopyUuid;
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
          child: Image.asset(
            'assets/logo.png',
            height: 28,
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
