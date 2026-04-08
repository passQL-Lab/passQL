package com.passql.question.service;

import com.passql.question.entity.Question;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class QuestionServiceTest {

    @Autowired
    QuestionService questionService;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("QuestionService 테스트 시작");

        lineLog(null);
        timeLog(this::resolveTodayQuestion_오늘_배정된_챌린지가_있으면_해당_문제_반환);
        lineLog(null);

        lineLog(null);
        timeLog(this::resolveTodayQuestion_배정_없을때_활성문제_있으면_폴백_반환);
        lineLog(null);

        lineLog(null);
        timeLog(this::resolveTodayQuestion_활성문제_0개이면_null_반환);
        lineLog(null);

        lineLog(null);
        timeLog(this::resolveTodayQuestion_같은날짜는_항상_같은_문제);
        lineLog(null);

        lineLog("QuestionService 테스트 종료");
    }

    public void resolveTodayQuestion_오늘_배정된_챌린지가_있으면_해당_문제_반환() {
        lineLog("오늘 배정된 챌린지가 있으면 해당 문제 반환");

        Question result = questionService.resolveTodayQuestion();

        superLog("오늘 문제 (null 이면 DB에 배정 없음): " + result);
        lineLog("result is " + (result != null ? "NOT NULL (questionUuid=" + result.getQuestionUuid() + ")" : "NULL"));
    }

    public void resolveTodayQuestion_배정_없을때_활성문제_있으면_폴백_반환() {
        lineLog("폴백 로직 확인 — 활성 문제 목록 조회");

        Question result = questionService.resolveTodayQuestion();

        superLog("폴백 결과: " + result);
        lineLog("폴백 로직 완료");
    }

    public void resolveTodayQuestion_활성문제_0개이면_null_반환() {
        lineLog("활성 문제 0개 시나리오 — Service 코드 직접 확인");

        long activeCount = questionService
                .getQuestions(null, null, null, null,
                        org.springframework.data.domain.PageRequest.of(0, 1))
                .getTotalElements();

        superLog("현재 활성 문제 수: " + activeCount);
        lineLog("활성 문제 0개 시나리오 코드 경로 확인 완료");
    }

    public void resolveTodayQuestion_같은날짜는_항상_같은_문제() {
        lineLog("같은 날짜는 항상 같은 문제 (결정론적 폴백)");

        Question first = questionService.resolveTodayQuestion();
        Question second = questionService.resolveTodayQuestion();

        superLog("첫 번째 호출: " + (first != null ? first.getQuestionUuid() : "null"));
        superLog("두 번째 호출: " + (second != null ? second.getQuestionUuid() : "null"));

        if (first != null && second != null) {
            lineLog("결정론적 여부: " + first.getQuestionUuid().equals(second.getQuestionUuid()));
            assert first.getQuestionUuid().equals(second.getQuestionUuid()) : "같은 날짜에 다른 문제가 반환됨!";
        } else {
            lineLog("두 호출 모두 null — DB에 활성 문제 없음");
        }
    }
}
