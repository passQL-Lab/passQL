package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.entity.Question;
import com.passql.question.repository.QuestionChoiceRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final QuestionChoiceRepository questionChoiceRepository;

    public Page<QuestionSummary> getQuestions(String topic, String subtopic, Integer difficulty, String mode, Pageable pageable) {
        throw new UnsupportedOperationException("TODO");
    }

    public QuestionDetail getQuestion(Long id) {
        throw new UnsupportedOperationException("TODO");
    }

    public Question getQuestionEntity(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));
    }
}
