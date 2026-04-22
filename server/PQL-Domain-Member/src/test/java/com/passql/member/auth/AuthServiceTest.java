package com.passql.member.auth;

import com.passql.member.auth.application.AuthService;
import com.passql.member.auth.application.dto.LoginCommand;
import com.passql.member.auth.application.dto.LoginResult;
import com.passql.member.auth.infrastructure.jwt.JwtTokenProvider;
import com.passql.member.auth.repository.RefreshTokenRepository;
import com.passql.member.constant.AuthProvider;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class AuthServiceTest {

    @Autowired AuthService authService;
    @Autowired JwtTokenProvider jwtTokenProvider;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired MemberRepository memberRepository;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("Auth 인증 시스템 테스트 시작");

        lineLog(null);
        timeLog(this::jwt_토큰_발급_및_파싱_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::jwt_만료토큰_silent_파싱_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::refreshToken_redis_저장_조회_삭제_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::login_신규회원_가입_후_토큰_발급_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::login_기존회원_재로그인_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::reissue_토큰_재발급_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::logout_redis_삭제_테스트);
        lineLog(null);

        lineLog("Auth 인증 시스템 테스트 종료");
    }

    // ── JWT 단위 테스트 ──────────────────────────────────────

    public void jwt_토큰_발급_및_파싱_테스트() {
        lineLog("JWT 토큰 발급 및 파싱 테스트");

        // 테스트용 더미 Member 생성 (DB 저장 X, signUp 팩토리 사용)
        Member member = Member.signUp(
            "test-provider-id-" + UUID.randomUUID(),
            AuthProvider.GOOGLE,
            "test@passql.kr",
            true,
            "테스트닉네임"
        );

        String accessToken = jwtTokenProvider.createAccessToken(member);
        String refreshToken = jwtTokenProvider.createRefreshToken(member);

        superLog("AccessToken 앞 50자: " + accessToken.substring(0, Math.min(50, accessToken.length())));
        superLog("RefreshToken 앞 50자: " + refreshToken.substring(0, Math.min(50, refreshToken.length())));

        UUID parsedUuid = jwtTokenProvider.getMemberUuidFromAccessToken(accessToken);
        superLog("파싱된 memberUuid: " + parsedUuid);
        superLog("원본 memberUuid: " + member.getMemberUuid());

        lineLog("AccessToken 파싱 일치: " + member.getMemberUuid().equals(parsedUuid));
    }

    public void jwt_만료토큰_silent_파싱_테스트() {
        lineLog("만료 토큰 silent 파싱 테스트 (예외 없이 UUID 추출)");

        // 실제 만료 토큰을 만들기 어려워 잘못된 토큰으로 예외 처리 확인
        String fakeExpiredToken = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMX0.fake";

        try {
            UUID uuid = jwtTokenProvider.getMemberUuidFromRefreshTokenSilently(fakeExpiredToken);
            superLog("silent 파싱 결과: " + uuid);
        } catch (Exception e) {
            // 완전히 잘못된 토큰은 예외 발생 가능 — silent는 만료만 허용
            superLog("예외 발생 (정상): " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }

        lineLog("만료 토큰 silent 파싱 테스트 완료");
    }

    // ── Redis RefreshToken 단위 테스트 ───────────────────────

    public void refreshToken_redis_저장_조회_삭제_테스트() {
        lineLog("RefreshToken Redis 저장/조회/삭제 테스트");

        UUID testUuid = UUID.randomUUID();
        String testToken = "test-refresh-token-" + testUuid;
        long ttlMs = 60_000L; // 1분

        // 저장
        refreshTokenRepository.save(testUuid, testToken, ttlMs);
        superLog("저장 완료: key=refresh_token:" + testUuid);

        // 조회
        Optional<String> found = refreshTokenRepository.findByMemberUuid(testUuid);
        superLog("조회 결과: " + found.orElse("없음"));
        lineLog("저장/조회 일치: " + found.map(t -> t.equals(testToken)).orElse(false));

        // 삭제
        refreshTokenRepository.delete(testUuid);
        Optional<String> afterDelete = refreshTokenRepository.findByMemberUuid(testUuid);
        superLog("삭제 후 조회: " + afterDelete.orElse("없음 (정상)"));
        lineLog("삭제 확인: " + afterDelete.isEmpty());
    }

    // ── AuthService 통합 테스트 (실제 Firebase idToken 없이) ──

    public void login_신규회원_가입_후_토큰_발급_테스트() {
        lineLog("신규 회원 로그인 테스트 — providerUserId 직접 세팅 (Firebase 미사용)");

        // DB에 해당 providerUserId 없으면 신규 가입 흐름 검증
        String uniqueProviderId = "test-google-" + UUID.randomUUID();
        long memberCountBefore = memberRepository.count();
        superLog("테스트 전 회원 수: " + memberCountBefore);

        // Member.signUp 직접 호출로 가입 시뮬레이션
        Member newMember = Member.signUp(
            uniqueProviderId, AuthProvider.GOOGLE,
            "newuser@passql.kr", true, "신규유저"
        );
        memberRepository.save(newMember);

        long memberCountAfter = memberRepository.count();
        superLog("저장 후 회원 수: " + memberCountAfter);
        lineLog("신규 회원 저장 확인: " + (memberCountAfter == memberCountBefore + 1));

        // 토큰 발급
        String accessToken = jwtTokenProvider.createAccessToken(newMember);
        String refreshToken = jwtTokenProvider.createRefreshToken(newMember);
        long ttlMs = jwtTokenProvider.getRefreshTokenExpirationMillis();
        refreshTokenRepository.save(newMember.getMemberUuid(), refreshToken, ttlMs);

        superLog("AccessToken 발급 길이: " + accessToken.length());
        superLog("RefreshToken Redis 저장 UUID: " + newMember.getMemberUuid());

        // Redis에 저장됐는지 확인
        Optional<String> stored = refreshTokenRepository.findByMemberUuid(newMember.getMemberUuid());
        lineLog("RefreshToken Redis 저장 확인: " + stored.isPresent());

        // 정리
        refreshTokenRepository.delete(newMember.getMemberUuid());
    }

    public void login_기존회원_재로그인_테스트() {
        lineLog("기존 회원 재로그인 테스트");

        // DB에서 실제 회원 한 명 조회
        Member existing = memberRepository.findAll().stream()
            .filter(m -> !m.getIsDeleted())
            .findFirst()
            .orElse(null);

        if (existing == null) {
            lineLog("조회 가능한 회원 없음 — SKIP");
            return;
        }

        superLog("기존 회원 UUID: " + existing.getMemberUuid());
        superLog("기존 회원 provider: " + existing.getAuthProvider());

        String accessToken = jwtTokenProvider.createAccessToken(existing);
        UUID parsedUuid = jwtTokenProvider.getMemberUuidFromAccessToken(accessToken);

        lineLog("토큰 발급 후 UUID 일치: " + existing.getMemberUuid().equals(parsedUuid));
    }

    public void reissue_토큰_재발급_테스트() {
        lineLog("RefreshToken으로 AccessToken 재발급 테스트");

        // 신규 더미 회원으로 테스트
        Member member = Member.signUp(
            "reissue-test-" + UUID.randomUUID(),
            AuthProvider.KAKAO, "reissue@passql.kr", true, "재발급테스터"
        );
        memberRepository.save(member);

        String refreshToken = jwtTokenProvider.createRefreshToken(member);
        refreshTokenRepository.save(member.getMemberUuid(), refreshToken, jwtTokenProvider.getRefreshTokenExpirationMillis());

        // Redis에서 조회 후 새 AccessToken 발급 시뮬레이션
        Optional<String> stored = refreshTokenRepository.findByMemberUuid(member.getMemberUuid());
        lineLog("RefreshToken 조회: " + stored.isPresent());

        if (stored.isPresent() && stored.get().equals(refreshToken)) {
            // 토큰 일치 확인 후 새 AccessToken 발급
            String newAccessToken = jwtTokenProvider.createAccessToken(member);
            superLog("새 AccessToken 발급: " + newAccessToken.substring(0, Math.min(50, newAccessToken.length())));
            lineLog("재발급 성공");
        }

        // 정리
        refreshTokenRepository.delete(member.getMemberUuid());
    }

    public void logout_redis_삭제_테스트() {
        lineLog("로그아웃 — Redis RefreshToken 삭제 테스트");

        Member member = Member.signUp(
            "logout-test-" + UUID.randomUUID(),
            AuthProvider.NAVER, "logout@passql.kr", true, "로그아웃테스터"
        );
        memberRepository.save(member);

        String refreshToken = jwtTokenProvider.createRefreshToken(member);
        refreshTokenRepository.save(member.getMemberUuid(), refreshToken, jwtTokenProvider.getRefreshTokenExpirationMillis());

        superLog("로그아웃 전 Redis 조회: " + refreshTokenRepository.findByMemberUuid(member.getMemberUuid()).isPresent());

        // 로그아웃 — UUID silent 파싱 후 삭제 시뮬레이션
        UUID uuidFromToken = jwtTokenProvider.getMemberUuidFromRefreshTokenSilently(refreshToken);
        if (uuidFromToken != null) {
            refreshTokenRepository.delete(uuidFromToken);
        }

        boolean afterLogout = refreshTokenRepository.findByMemberUuid(member.getMemberUuid()).isEmpty();
        superLog("로그아웃 후 Redis 삭제 확인: " + afterLogout);
        lineLog("로그아웃 테스트 완료: " + afterLogout);
    }
}
