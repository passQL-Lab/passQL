import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'core/app_theme.dart';
import 'presentation/providers/member_store.dart';
import 'router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');

  // 앱 렌더링 전 UUID 등록 완료
  final container = ProviderContainer();
  await container.read(memberStoreProvider.notifier).getOrRegister();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const PassqlApp(),
    ),
  );
}

class PassqlApp extends StatelessWidget {
  const PassqlApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      // iPhone 15 기준 디자인 사이즈
      designSize: const Size(390, 844),
      minTextAdapt: true,
      builder: (_, _) => MaterialApp.router(
        title: 'passQL',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
