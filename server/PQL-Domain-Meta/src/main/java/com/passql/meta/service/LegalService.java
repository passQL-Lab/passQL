package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.constant.LegalStatus;
import com.passql.meta.constant.LegalType;
import com.passql.meta.dto.LegalResponse;
import com.passql.meta.dto.LegalUpdateRequest;
import com.passql.meta.entity.Legal;
import com.passql.meta.repository.LegalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LegalService {

    private final LegalRepository legalRepository;

    /** PUBLISHED 상태인 약관만 공개 API에서 반환 */
    public LegalResponse getPublished(LegalType type) {
        Legal legal = legalRepository.findByType(type)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTING_NOT_FOUND));
        if (legal.getStatus() != LegalStatus.PUBLISHED) {
            throw new CustomException(ErrorCode.SETTING_NOT_FOUND);
        }
        return LegalResponse.from(legal);
    }

    public List<LegalResponse> findAll() {
        return legalRepository.findAllByOrderByTypeAsc().stream()
                .map(LegalResponse::from)
                .toList();
    }

    @Transactional
    public void update(LegalType type, LegalUpdateRequest request) {
        Legal legal = legalRepository.findByType(type)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTING_NOT_FOUND));
        legal.setTitle(request.title());
        legal.setContent(request.content());
    }

    @Transactional
    public void updateStatus(LegalType type, LegalStatus status) {
        Legal legal = legalRepository.findByType(type)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTING_NOT_FOUND));
        legal.setStatus(status);
    }
}
