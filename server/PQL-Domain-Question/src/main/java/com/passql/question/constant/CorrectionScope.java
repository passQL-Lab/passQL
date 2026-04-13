package com.passql.question.constant;

public enum CorrectionScope {
    NONE,           // 보정 없음
    QUESTION_WIDE,  // 해당 questionUuid 전체 오답 보정
    CHOICE_SET_ONLY // 해당 choiceSetUuid 기준 오답만 보정
}
