import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 앱 전역 Dio 인스턴스 Provider.
///
/// baseUrl은 .env의 BACKEND_BASE_URL에서 읽음.
/// 타임아웃 25초, JSON Content-Type 기본 설정.
final dioProvider = Provider<Dio>((ref) {
  final baseUrl = dotenv.env['BACKEND_BASE_URL'] ?? '';
  return Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 25),
      receiveTimeout: const Duration(seconds: 25),
      headers: {'Content-Type': 'application/json'},
    ),
  );
});
