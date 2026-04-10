import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';

typedef _TabInfo = ({String path, FaIconData icon, String label});

/// ShellRoute builder에서 사용하는 바텀 네비게이션 쉘.
///
/// 탭 선택 상태는 현재 라우트 경로로 결정한다 — 별도 상태 불필요.
class AppShell extends StatelessWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  static const List<_TabInfo> _tabs = [
    (path: '/home', icon: FontAwesomeIcons.house, label: '홈'),
    (path: '/questions', icon: FontAwesomeIcons.book, label: '문제'),
    (path: '/stats', icon: FontAwesomeIcons.chartSimple, label: '통계'),
    (path: '/settings', icon: FontAwesomeIcons.gear, label: '설정'),
  ];

  /// 현재 경로에서 탭 인덱스 결정. 매칭 없으면 0(홈) 반환.
  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final idx = _tabs.indexWhere((t) => location.startsWith(t.path));
    return idx < 0 ? 0 : idx;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) => context.go(_tabs[index].path),
        items: _tabs
            .map(
              (tab) => BottomNavigationBarItem(
                icon: FaIcon(tab.icon),
                label: tab.label,
              ),
            )
            .toList(),
      ),
    );
  }
}
