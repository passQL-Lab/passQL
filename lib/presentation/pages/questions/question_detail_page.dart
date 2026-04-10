import 'package:flutter/material.dart';

/// 문제 상세/풀기 화면 플레이스홀더 — Phase 3에서 구현
class QuestionDetailPage extends StatelessWidget {
  final String questionUuid;

  const QuestionDetailPage({super.key, required this.questionUuid});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('문제 풀기')),
      body: Center(child: Text('문제 UUID: $questionUuid')),
    );
  }
}
