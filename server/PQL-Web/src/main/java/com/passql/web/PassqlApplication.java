package com.passql.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.passql")
@EntityScan(basePackages = "com.passql")
@EnableJpaRepositories(basePackages = "com.passql")
public class PassqlApplication {

    public static void main(String[] args) {
        SpringApplication.run(PassqlApplication.class, args);
    }
}
