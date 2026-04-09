package com.passql.web.controller;

import com.passql.application.service.QuizSessionService;
import com.passql.application.service.QuizSessionService.QuestionWithChoiceSet;
import com.passql.application.service.QuizSessionService.SubmitAnswerResult;
import com.passql.question.entity.QuizSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 사용자 퀴즈 플로우 컨트롤러.
 * <p>
 * POST /quiz/start           — 세션 생성 → 첫 문제 redirect
 * GET  /quiz/{id}/q/{index}  — 문제 풀이 페이지
 * POST /quiz/{id}/q/{index}/submit — 답 제출
 * GET  /quiz/{id}/q/{index}/result — 제출 결과
 * GET  /quiz/{id}/complete   — 세션 완료
 */
@Slf4j
@Controller
@RequestMapping("/quiz")
@RequiredArgsConstructor
public class QuizController {

    private final QuizSessionService quizSessionService;

    @PostMapping("/start")
    public String start(@RequestParam UUID memberUuid) {
        QuizSession session = quizSessionService.createSession(memberUuid);
        return "redirect:/quiz/" + session.getSessionUuid() + "/q/0";
    }

    @GetMapping("/{sessionUuid}/q/{index}")
    public String question(
            @PathVariable UUID sessionUuid,
            @PathVariable int index,
            Model model) {
        QuestionWithChoiceSet data = quizSessionService.getQuestionAt(sessionUuid, index);
        model.addAttribute("question", data.question());
        model.addAttribute("choiceSet", data.choiceSet());
        model.addAttribute("items", data.items());
        model.addAttribute("session", data.session());
        model.addAttribute("index", index);
        return "quiz/question";
    }

    @PostMapping("/{sessionUuid}/q/{index}/submit")
    public String submit(
            @PathVariable UUID sessionUuid,
            @PathVariable int index,
            @RequestParam UUID choiceSetUuid,
            @RequestParam String choiceKey,
            Model model) {
        SubmitAnswerResult result = quizSessionService.submitAnswer(
                sessionUuid, index, choiceSetUuid, choiceKey);
        model.addAttribute("result", result);
        model.addAttribute("sessionUuid", sessionUuid);
        model.addAttribute("index", index);
        model.addAttribute("totalQuestions", 10);
        return "quiz/result";
    }

    @GetMapping("/{sessionUuid}/complete")
    public String complete(@PathVariable UUID sessionUuid, Model model) {
        QuizSession session = quizSessionService.completeSession(sessionUuid);
        model.addAttribute("session", session);
        return "quiz/complete";
    }
}
