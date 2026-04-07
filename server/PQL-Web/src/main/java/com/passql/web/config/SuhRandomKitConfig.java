package com.passql.web.config;

import com.passql.common.util.NicknameGenerator;
import me.suhsaechan.suhnicknamegenerator.core.SuhRandomKit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * SuhRandomKit + NicknameGenerator Bean 등록.
 *
 * <p>로직성 유틸({@link NicknameGenerator})은 PQL-Common/util에 두고,
 * 외부 라이브러리 조립은 PQL-Web/config에서 수행한다.
 *
 * <p>SuhRandomKit 설정 (이슈 본문 기준):
 * <ul>
 *   <li>locale: ko</li>
 *   <li>numberLength: 4</li>
 *   <li>uuidLength: 4</li>
 * </ul>
 *
 * <p><strong>주의</strong>: 실제 SuhRandomKit 빌더 메서드명은 라이브러리 버전(1.1.0)에 따라
 * 다를 수 있다. 빌더가 아니면 {@code SuhRandomKit.builder()...} 부분을 라이브러리 API에
 * 맞춰 수정해야 한다.
 */
@Configuration
public class SuhRandomKitConfig {

    @Bean
    public SuhRandomKit suhRandomKit() {
        return SuhRandomKit.builder()
            .locale("ko")
            .numberLength(4)
            .uuidLength(4)
            .build();
    }

    @Bean
    public NicknameGenerator nicknameGenerator(SuhRandomKit suhRandomKit) {
        return new NicknameGenerator(suhRandomKit);
    }
}
