import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:passql_app/core/app_colors.dart';

void main() {
  group('AppColors — Design System 토큰', () {
    test('브랜드 인디고가 #4F46E5다', () {
      expect(AppColors.brandIndigo.value, equals(const Color(0xFF4F46E5).value));
    });
    test('페이지 배경이 #FAFAFA다', () {
      expect(AppColors.pageBg.value, equals(const Color(0xFFFAFAFA).value));
    });
    test('카드 배경이 #FFFFFF다', () {
      expect(AppColors.cardBg.value, equals(const Color(0xFFFFFFFF).value));
    });
    test('코드 블록 배경이 #F3F4F6다', () {
      expect(AppColors.codeBg.value, equals(const Color(0xFFF3F4F6).value));
    });
    test('기본 테두리가 #E5E7EB다', () {
      expect(AppColors.borderDefault.value, equals(const Color(0xFFE5E7EB).value));
    });
    test('성공 색상이 #22C55E다', () {
      expect(AppColors.success.value, equals(const Color(0xFF22C55E).value));
    });
    test('에러 색상이 #EF4444다', () {
      expect(AppColors.error.value, equals(const Color(0xFFEF4444).value));
    });
  });
}
