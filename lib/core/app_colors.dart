import 'package:flutter/material.dart';

/// 앱 전역 색상 팔레트
/// App Global Color Palette
///
/// 사용법:
/// - Container(color: AppColors.white)
class AppColors {
  // Private 생성자 - 인스턴스화 방지
  // Private constructor to prevent instantiation
  AppColors._();

  // ============================================
  // 기본 색상 (Base Colors)
  // ============================================

  /// 흰색
  /// White color
  static const Color white = Color(0xFFFFFFFF);

  /// 검정색
  /// Black color
  static const Color black = Color(0xFF080A0C);

  // ============================================
  // 흑백 계열 (Black Scale)
  // ============================================

  /// 검정 900
  /// Black 900
  static const Color black900 = Color(0xFF1E232A);

  /// 검정 800
  /// Black 800
  static const Color black800 = Color(0xFF333D48);

  /// 검정 700
  /// Black 700
  static const Color black700 = Color(0xFF485665);

  /// 검정 600
  /// Black 600
  static const Color black600 = Color(0xFF5D6F83);

  /// 검정 500
  /// Black 500
  static const Color black500 = Color(0xFF76899E);

  /// 검정 400
  /// Black 400
  static const Color black400 = Color(0xFF93A2B3);

  /// 검정 300
  /// Black 300
  static const Color black300 = Color(0xFFB1BCC8);

  /// 검정 200
  /// Black 200
  static const Color black200 = Color(0xFFCFD6DD);

  /// 검정 100
  /// Black 100
  static const Color black100 = Color(0xFFEDF0F2);

  // ============================================
  // 초록 계열 (Green Scale)
  // ============================================

  /// 초록
  /// Green color
  static const Color green = Color(0xFF38F55B);

  /// 초록 800
  /// Green 800
  static const Color green800 = Color(0xFF7AF391);

  /// 초록 500
  /// Green 500
  static const Color green500 = Color(0xFFACF8BA);

  /// 초록 100
  /// Green 100
  static const Color green100 = Color(0xFFEFFEF2);

  // ============================================
  // 파랑 계열 (Blue Scale)
  // ============================================

  /// 파랑
  /// Blue color
  static const Color blue = Color(0xFF3F63D9);

  /// 파랑 800
  /// Blue 800
  static const Color blue800 = Color(0xFF6582E1);

  /// 파랑 500
  /// Blue 500
  static const Color blue500 = Color(0xFF9FB1EC);

  /// 파랑 100
  /// Blue 100
  static const Color blue100 = Color(0xFFECF0FC);

  // ============================================
  // 빨강 계열 (Red Scale)
  // ============================================

  /// 빨강
  /// Red color
  static const Color red = Color(0xFFF5383B);

  /// 빨강 900
  /// Red 900
  static const Color red900 = Color(0xFFE64C4F);

  /// 빨강 800
  /// Red 800
  static const Color red800 = Color(0xFFE76062);

  /// 빨강 500
  /// Red 500
  static const Color red500 = Color(0xFFFA9C9E);

  /// 빨강 100
  /// Red 100
  static const Color red100 = Color(0xFFFEECEC);

  // ============================================
  // 노랑 계열 (Yellow Scale)
  // ============================================

  /// 노랑
  /// Yellow color
  static const Color yellow = Color(0xFFF5EF38);

  /// 노랑 900
  /// Yellow 900
  static const Color yellow900 = Color(0xFFF7F260);

  // ============================================
  // 진한 초록 계열 (Deep Green Scale)
  // ============================================

  /// 진한 초록
  /// Deep green color
  static const Color deepGreen = Color(0xFF00CE75);

  /// 진한 초록 900
  /// Deep green 900
  static const Color deepGreen900 = Color(0xFF33D890);
}
