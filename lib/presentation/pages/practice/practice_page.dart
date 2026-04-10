import 'package:flutter/material.dart';

/// 연습 모드 화면 플레이스홀더 — Phase 4에서 구현
class PracticePage extends StatelessWidget {
  final String sessionId;

  const PracticePage({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('연습 모드')),
      body: Center(child: Text('세션 ID: $sessionId')),
    );
  }
}
