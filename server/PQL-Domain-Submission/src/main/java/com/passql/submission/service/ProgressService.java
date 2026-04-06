package com.passql.submission.service;

import com.passql.submission.dto.HeatmapEntry;
import com.passql.submission.dto.ProgressSummary;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {
    private final SubmissionRepository submissionRepository;

    public ProgressSummary getSummary(String userUuid) {
        throw new UnsupportedOperationException("TODO");
    }

    public List<HeatmapEntry> getHeatmap(String userUuid) {
        throw new UnsupportedOperationException("TODO");
    }
}
