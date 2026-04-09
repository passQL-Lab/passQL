package com.passql.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.passql")
@EntityScan(basePackages = "com.passql")
@EnableJpaRepositories(basePackages = "com.passql")
@EnableScheduling
public class PassqlApplication {

    public static void main(String[] args) {
        SpringApplication.run(PassqlApplication.class, args);
    }
}
