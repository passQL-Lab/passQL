package com.passql.member.auth.application;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.common.util.NicknameGenerator;
import com.passql.member.auth.application.dto.command.LoginCommand;
import com.passql.member.auth.application.dto.result.LoginResult;
import com.passql.member.auth.domain.Tokens;
import com.passql.member.auth.infrastructure.jwt.JwtTokenProvider;
import com.passql.member.auth.infrastructure.social.strategy.SocialLoginStrategy;
import com.passql.member.auth.repository.RefreshTokenRepository;
import com.passql.member.constant.AuthProvider;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final int NICKNAME_RETRY = 3;

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final NicknameGenerator nicknameGenerator;
    private final Map<AuthProvider, SocialLoginStrategy> socialLoginStrategyMap;

    /** 소셜 로그인. 신규면 가입 처리 후 isNewMember=true, 기존이면 false. */
    @Transactional
    public LoginResult login(LoginCommand command) {
        SocialLoginStrategy strategy = socialLoginStrategyMap.get(command.authProvider());
        if (strategy == null) {
            throw new CustomException(ErrorCode.UNSUPPORTED_AUTH_PROVIDER);
        }

        String socialId = strategy.validateAndGetSocialId(command.idToken());

        Optional<Member> existing = memberRepository
                .findByAuthProviderAndProviderUserIdAndIsDeletedFalse(command.authProvider(), socialId);

        boolean isNew = existing.isEmpty();
        Member member = existing.orElseGet(() -> registerNewMember(socialId, command.authProvider()));

        Tokens tokens = issueTokens(member);
        return LoginResult.of(member, isNew, tokens);
    }

    /** RefreshToken으로 토큰 재발급. Redis 저장값과 비교 후 새 토큰 쌍 발급. */
    @Transactional
    public Tokens reissueTokens(String refreshToken) {
        UUID memberUuid = jwtTokenProvider.getMemberUuidFromRefreshToken(refreshToken);

        String stored = refreshTokenRepository.findByMemberUuid(memberUuid);
        if (!refreshToken.equals(stored)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }

        Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        return issueTokens(member);
    }

    /** 로그아웃 — Redis RefreshToken 삭제. 만료된 토큰도 UUID 파싱 후 삭제 시도. */
    public void logout(String refreshToken) {
        jwtTokenProvider.getMemberUuidFromRefreshTokenSilently(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    private Member registerNewMember(String socialId, AuthProvider authProvider) {
        for (int attempt = 1; attempt <= NICKNAME_RETRY; attempt++) {
            String nickname = nicknameGenerator.generateUnique(
                    memberRepository::existsByNicknameAndIsDeletedFalse);
            Member member = Member.signUp(socialId, authProvider, null, false, nickname);
            try {
                return memberRepository.saveAndFlush(member);
            } catch (DataIntegrityViolationException e) {
                log.warn("[Auth] 닉네임 충돌 재시도 {}/{}", attempt, NICKNAME_RETRY);
                if (attempt == NICKNAME_RETRY) {
                    throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED, e);
                }
            }
        }
        throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED);
    }

    private Tokens issueTokens(Member member) {
        String accessToken = jwtTokenProvider.createAccessToken(member);
        String refreshToken = jwtTokenProvider.createRefreshToken(member);
        refreshTokenRepository.save(member.getMemberUuid(), refreshToken,
                jwtTokenProvider.getRefreshTokenExpirationMillis());
        return new Tokens(accessToken, refreshToken);
    }
}
