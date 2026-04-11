package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.TopicRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.submission.dto.TopicAnalysisResponse;
import com.passql.submission.dto.TopicStat;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TopicAnalysisService {

    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;
    private final MemberRepository memberRepository;

    public TopicAnalysisResponse getTopicAnalysis(UUID memberUuid) {
        // 존재하지 않는 회원 UUID 방어 (ProgressService.getHeatmap과 동일 패턴)
        if (!memberRepository.existsById(memberUuid)) {
            throw new CustomException(ErrorCode.MEMBER_NOT_FOUND);
        }
        LocalDateTime since = LocalDateTime.now().minusDays(7);

        // 토픽별 정답률/풀이수 (최근 7일, 문제별 최근 시도 기준)
        Map<UUID, double[]> statMap = new HashMap<>(); // [solvedCount, correctRate]
        List<Object[]> statRows = submissionRepository.findTopicStatsAfter(memberUuid.toString(), since);
        for (Object[] row : statRows) {
            UUID topicUuid = UUID.fromString(row[0].toString());
            long solvedCount = ((Number) row[1]).longValue();
            double correctRate = ((Number) row[2]).doubleValue();
            statMap.put(topicUuid, new double[]{solvedCount, correctRate});
        }

        // 토픽별 전체 활성 문제 수
        Map<UUID, Long> totalMap = new HashMap<>();
        List<Object[]> totalRows = questionRepository.countActiveByTopic();
        for (Object[] row : totalRows) {
            UUID topicUuid = UUID.fromString(row[0].toString());
            long totalCount = ((Number) row[1]).longValue();
            totalMap.put(topicUuid, totalCount);
        }

        // 전체 활성 토픽 기준으로 merge
        List<Topic> topics = topicRepository.findByIsActiveTrueOrderBySortOrderAsc();
        List<TopicStat> topicStats = topics.stream().map(topic -> {
            UUID topicUuid = topic.getTopicUuid();
            double[] stat = statMap.getOrDefault(topicUuid, new double[]{0, 0.0});
            long totalCount = totalMap.getOrDefault(topicUuid, 0L);
            return new TopicStat(
                topicUuid,
                topic.getDisplayName(),
                (int) totalCount,
                Math.round(stat[1] * 100.0) / 100.0,
                (int) stat[0]
            );
        }).toList();

        return new TopicAnalysisResponse(topicStats);
    }
}
