package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.AuthProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
public class NaverLoginStrategy implements SocialLoginStrategy {

    private static final String NAVER_USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @SuppressWarnings("unchecked")
    public String validateAndGetSocialId(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            ResponseEntity<Map> response = restTemplate.exchange(
                    NAVER_USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Map<String, Object> responseBody = response.getBody();
            Map<String, Object> responseInfo = (Map<String, Object>) responseBody.get("response");
            if (responseInfo == null || responseInfo.get("id") == null) {
                throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
            }
            return String.valueOf(responseInfo.get("id"));
        } catch (RestClientException e) {
            log.error("[Naver] 사용자 정보 조회 실패", e);
            throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
        }
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.NAVER;
    }
}
