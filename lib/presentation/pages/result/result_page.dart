import 'package:flutter/material.dart';

/// 정답/오답 피드백 화면 플레이스홀더 — Phase 3에서 구현
///
/// [extra]는 Phase 3에서 SubmitResult 타입으로 교체된다.
class ResultPage extends StatelessWidget {
  final Object? extra;

  const ResultPage({super.key, this.extra});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('결과')),
      body: const Center(child: Text('결과 화면')),
    );
  }
}
