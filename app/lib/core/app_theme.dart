import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'text_styles.dart';

/// MaterialApp에 주입할 ThemeData.
///
/// Design.md 원칙: 그림자 없음, 명시적 보더, 배경색 차이로 elevation 표현.
class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.pageBg,
        colorScheme: const ColorScheme.light(
          primary: AppColors.brandIndigo,
          onPrimary: AppColors.white,
          secondary: AppColors.accentMedium,
          onSecondary: AppColors.white,
          surface: AppColors.cardBg,
          onSurface: AppColors.textPrimary,
          error: AppColors.error,
          onError: AppColors.white,
        ),
        // 앱바 — 그림자 없음
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.cardBg,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
          shadowColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          titleTextStyle:
              AppTextStyles.heading_20.copyWith(color: AppColors.textPrimary),
        ),
        // 카드 — elevation 없음, 명시적 보더
        cardTheme: CardThemeData(
          color: AppColors.cardBg,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.borderDefault),
          ),
          margin: EdgeInsets.zero,
        ),
        // Primary CTA 버튼
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.brandIndigo,
            foregroundColor: AppColors.white,
            minimumSize: const Size.fromHeight(44),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            elevation: 0,
            textStyle: AppTextStyles.label_16,
          ),
        ),
        // Secondary 버튼
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.brandIndigo,
            minimumSize: const Size.fromHeight(44),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            side: const BorderSide(color: AppColors.brandIndigo),
            textStyle: AppTextStyles.label16Medium,
          ),
        ),
        // 바텀 네비게이션
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: AppColors.cardBg,
          selectedItemColor: AppColors.brandIndigo,
          unselectedItemColor: AppColors.textCaption,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedLabelStyle: AppTextStyles.tag_12,
          unselectedLabelStyle: AppTextStyles.tag_12,
        ),
        // 구분선
        dividerTheme: const DividerThemeData(
          color: AppColors.borderDefault,
          thickness: 1,
          space: 0,
        ),
        fontFamily: 'Pretendard-Regular',
      );
}
