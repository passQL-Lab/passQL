import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:passql_app/core/app_colors.dart';

void main() {
  group('AppColors — Design System 토큰', () {
    test('브랜드 인디고가 #4F46E5다', () {
      expect(AppColors.brandIndigo.toARGB32(), equals(const Color(0xFF4F46E5).toARGB32()));
    });
    test('페이지 배경이 #FAFAFA다', () {
      expect(AppColors.pageBg.toARGB32(), equals(const Color(0xFFFAFAFA).toARGB32()));
    });
    test('카드 배경이 #FFFFFF다', () {
      expect(AppColors.cardBg.toARGB32(), equals(const Color(0xFFFFFFFF).toARGB32()));
    });
    test('코드 블록 배경이 #F3F4F6다', () {
      expect(AppColors.codeBg.toARGB32(), equals(const Color(0xFFF3F4F6).toARGB32()));
    });
    test('기본 테두리가 #E5E7EB다', () {
      expect(AppColors.borderDefault.toARGB32(), equals(const Color(0xFFE5E7EB).toARGB32()));
    });
    test('성공 색상이 #22C55E다', () {
      expect(AppColors.success.toARGB32(), equals(const Color(0xFF22C55E).toARGB32()));
    });
    test('에러 색상이 #EF4444다', () {
      expect(AppColors.error.toARGB32(), equals(const Color(0xFFEF4444).toARGB32()));
    });
  });
}
