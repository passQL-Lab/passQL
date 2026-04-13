package com.passql.question.constant;

public enum ReportCategory {
    WRONG_ANSWER,    // 정답이 틀렸다
    WEIRD_QUESTION,  // 문제 자체가 이상하다
    WEIRD_CHOICES,   // 선택지가 이상하다
    WEIRD_EXECUTION, // SQL 실행 결과가 이상하다
    ETC              // 기타
}
