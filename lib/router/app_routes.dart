/// 앱 내 모든 라우트 경로 상수.
///
/// 문자열 경로를 직접 사용하는 대신 이 클래스를 참조한다 — 오타 방지.
abstract final class AppRoutes {
  // 탭 루트
  static const String home = '/home';
  static const String questions = '/questions';
  static const String stats = '/stats';
  static const String settings = '/settings';

  // 문제 탭 서브 라우트
  /// 토픽 선택 후 챕터 플로우. topic(topicCode), topicName 쿼리 파라미터.
  static const String questionChapter = '/questions/chapter';

  // 풀스크린
  /// 문제 상세. [uuid]는 questionUuid.
  static String questionDetail(String uuid) => '/questions/$uuid';

  /// 결과 화면. [uuid]는 questionUuid.
  static String questionResult(String uuid) => '/questions/$uuid/result';

  /// 연습 모드. [sessionId]는 클라이언트 생성 UUID.
  static String practice(String sessionId) => '/practice/$sessionId';

  /// 연습 결과.
  static String practiceResult(String sessionId) =>
      '/practice/$sessionId/result';
}
