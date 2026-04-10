// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'today_question_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TodayQuestionResponseImpl _$$TodayQuestionResponseImplFromJson(
  Map<String, dynamic> json,
) => _$TodayQuestionResponseImpl(
  question: json['question'] == null
      ? null
      : QuestionSummary.fromJson(json['question'] as Map<String, dynamic>),
  alreadySolvedToday: json['alreadySolvedToday'] as bool? ?? false,
);

Map<String, dynamic> _$$TodayQuestionResponseImplToJson(
  _$TodayQuestionResponseImpl instance,
) => <String, dynamic>{
  'question': instance.question,
  'alreadySolvedToday': instance.alreadySolvedToday,
};
