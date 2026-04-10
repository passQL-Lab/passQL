import 'package:flutter/material.dart';

/// 연습 결과 화면 플레이스홀더 — Phase 4에서 구현
class PracticeResultPage extends StatelessWidget {
  const PracticeResultPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('연습 결과')),
      body: const Center(child: Text('연습 결과 화면')),
    );
  }
}
