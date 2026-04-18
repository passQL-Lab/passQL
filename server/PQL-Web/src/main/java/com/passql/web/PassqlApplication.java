package com.passql.web;

import com.passql.member.auth.infrastructure.jwt.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.passql")
@EntityScan(basePackages = "com.passql")
@EnableJpaRepositories(basePackages = "com.passql")
@EnableScheduling
@EnableConfigurationProperties(JwtProperties.class)
public class PassqlApplication {

    public static void main(String[] args) {
        SpringApplication.run(PassqlApplication.class, args);
    }
}
