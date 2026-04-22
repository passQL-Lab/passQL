package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.member.constant.AuthProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration
public class SocialLoginStrategyConfig {

    @Bean
    public Map<AuthProvider, SocialLoginStrategy> socialLoginStrategyMap(
            List<SocialLoginStrategy> strategies) {
        return strategies.stream()
                .collect(Collectors.toMap(
                        SocialLoginStrategy::getAuthProvider,
                        Function.identity()
                ));
    }
}
