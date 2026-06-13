import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 앱 전역 Dio 인스턴스 Provider.
///
/// baseUrl은 .env의 BACKEND_BASE_URL에서 읽음.
/// 타임아웃 25초, JSON Content-Type 기본 설정.
/// 디버그 빌드에서는 LogInterceptor로 요청/응답 전체 로그 출력.
final dioProvider = Provider<Dio>((ref) {
  final baseUrl = dotenv.env['BACKEND_BASE_URL'] ?? '';
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 25),
      receiveTimeout: const Duration(seconds: 25),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  // 디버그 빌드에서만 로그 출력 (릴리즈 빌드에서는 제외)
  if (kDebugMode) {
    dio.interceptors.add(
      LogInterceptor(
        requestHeader: true,
        requestBody: true,
        responseHeader: false,
        responseBody: true,
        error: true,
        logPrint: (obj) => debugPrint('[DIO] $obj'),
      ),
    );
  }

  return dio;
});
