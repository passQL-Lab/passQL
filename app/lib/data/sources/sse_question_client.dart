import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../models/question/choice_item.dart';
import '../models/question/sse_event.dart';

/// POST /questions/{questionUuid}/generate-choices SSE 스트리밍 클라이언트.
///
/// Retrofit은 SSE를 지원하지 않으므로 Dio ResponseType.stream으로 직접 처리.
class SseQuestionClient {
  final Dio _dio;

  SseQuestionClient(this._dio);

  /// SSE 스트림 반환. 이벤트: SseStatusEvent, SseCompleteEvent, SseErrorEvent.
  /// 에러 발생 시 스트림에 SseErrorEvent yield 후 종료.
  Stream<SseEvent> generateChoices({
    required String questionUuid,
    required String memberUuid,
  }) async* {
    Response<ResponseBody> response;
    try {
      response = await _dio.post<ResponseBody>(
        '/questions/$questionUuid/generate-choices',
        options: Options(
          responseType: ResponseType.stream,
          headers: {
            'X-Member-UUID': memberUuid,
            'Accept': 'text/event-stream',
          },
        ),
      );
    } catch (e) {
      yield SseErrorEvent('CONNECT_FAILED', true);
      return;
    }

    // SSE 프로토콜: "event: <type>" 줄로 이벤트 타입을 지정하고,
    // "data: <json>" 줄에 페이로드, 빈 줄로 이벤트 경계를 구분.
    final lineStream = response.data!.stream
        .cast<List<int>>()
        .transform(utf8.decoder)
        .transform(const LineSplitter());

    var eventType = '';
    var dataLine = '';
    await for (final line in lineStream) {
      if (line.startsWith('event: ')) {
        // "event: status" / "event: complete" / "event: error"
        eventType = line.substring(7).trim();
      } else if (line.startsWith('data: ')) {
        dataLine = line.substring(6).trim();
      } else if (line.isEmpty) {
        // 빈 줄 = 이벤트 경계. data가 있으면 파싱 후 yield.
        if (dataLine.isNotEmpty) {
          final event = _parse(eventType, dataLine);
          if (event != null) yield event;
        }
        eventType = '';
        dataLine = '';
      }
    }

    // 스트림이 빈 줄 없이 종료된 경우 남은 data 처리.
    if (dataLine.isNotEmpty) {
      final event = _parse(eventType, dataLine);
      if (event != null) yield event;
    }
  }

  /// SSE [eventType]과 raw JSON 문자열로 이벤트 객체 생성.
  /// eventType이 없으면 json['type'] 필드로 폴백.
  SseEvent? _parse(String eventType, String raw) {
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      // event: 필드 우선, 없으면 json body의 type 필드 폴백
      final type = eventType.isNotEmpty ? eventType : json['type'] as String?;
      switch (type) {
        case 'status':
          return SseStatusEvent(json['message'] as String? ?? '처리 중...');
        case 'complete':
          final rawChoices = json['choices'] as List<dynamic>? ?? [];
          final choices = rawChoices
              .map((e) => ChoiceItem.fromJson(e as Map<String, dynamic>))
              .toList();
          return SseCompleteEvent(choices, json['choiceSetId'] as String? ?? '');
        case 'error':
          return SseErrorEvent(
            json['code'] as String? ?? 'UNKNOWN',
            json['retryable'] as bool? ?? false,
          );
        default:
          return null;
      }
    } catch (_) {
      return null;
    }
  }
}
