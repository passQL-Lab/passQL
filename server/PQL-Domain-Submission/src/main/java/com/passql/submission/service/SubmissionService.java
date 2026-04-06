package com.passql.submission.service;

import com.passql.question.dto.SubmitResult;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionService {
    private final SubmissionRepository submissionRepository;

    public SubmitResult submit(String userUuid, Long questionId, String selectedKey) {
        throw new UnsupportedOperationException("TODO");
    }
}
