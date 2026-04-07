package com.passql.common.util;

import lombok.RequiredArgsConstructor;
import me.suhsaechan.suhnicknamegenerator.core.SuhRandomKit;

import java.util.function.Predicate;

/**
 * 닉네임 생성 + 중복 회피 알고리즘 (3단 폴백).
 *
 * <p>이 클래스는 DB에 의존하지 않는다. 중복 체크는 호출자가 {@link Predicate}로 주입한다
 * (예: {@code memberRepository::existsByNicknameAndDeletedFalse}).
 *
 * <p>폴백 정책 (보수적):
 * <ol>
 *   <li>{@link SuhRandomKit#simpleNickname()} 3회 시도</li>
 *   <li>{@link SuhRandomKit#nicknameWithNumber()} 3회 시도</li>
 *   <li>{@link SuhRandomKit#nicknameWithUuid()} 1회 시도</li>
 *   <li>모두 실패 시 {@link IllegalStateException} 던진다 (호출자가 도메인 예외로 변환)</li>
 * </ol>
 */
@RequiredArgsConstructor
public class NicknameGenerator {

    private static final int SIMPLE_RETRY = 3;
    private static final int NUMBER_RETRY = 3;
    private static final int UUID_RETRY = 1;

    private final SuhRandomKit suhRandomKit;

    /**
     * @param duplicateCheck nickname을 받아 "이미 존재하면 true"를 반환하는 함수
     * @return 중복되지 않는 닉네임
     * @throws IllegalStateException 모든 폴백이 실패한 경우
     */
    public String generateUnique(Predicate<String> duplicateCheck) {
        for (int i = 0; i < SIMPLE_RETRY; i++) {
            String candidate = suhRandomKit.simpleNickname();
            if (!duplicateCheck.test(candidate)) {
                return candidate;
            }
        }
        for (int i = 0; i < NUMBER_RETRY; i++) {
            String candidate = suhRandomKit.nicknameWithNumber();
            if (!duplicateCheck.test(candidate)) {
                return candidate;
            }
        }
        for (int i = 0; i < UUID_RETRY; i++) {
            String candidate = suhRandomKit.nicknameWithUuid();
            if (!duplicateCheck.test(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException(
            "모든 닉네임 폴백 시도 실패 (simple=" + SIMPLE_RETRY
                + ", number=" + NUMBER_RETRY
                + ", uuid=" + UUID_RETRY + ")"
        );
    }
}
