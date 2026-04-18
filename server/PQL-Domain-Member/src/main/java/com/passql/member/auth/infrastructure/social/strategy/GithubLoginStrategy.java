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
public class GithubLoginStrategy implements SocialLoginStrategy {

    private static final String GITHUB_USER_INFO_URL = "https://api.github.com/user";
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String validateAndGetSocialId(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("X-GitHub-Api-Version", "2022-11-28");
            ResponseEntity<Map> response = restTemplate.exchange(
                    GITHUB_USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Object id = response.getBody().get("id");
            if (id == null) {
                throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
            }
            return String.valueOf(id);
        } catch (RestClientException e) {
            log.error("[Github] 사용자 정보 조회 실패", e);
            throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
        }
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.GITHUB;
    }
}
