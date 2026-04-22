package com.passql.web.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Configuration
@Profile("!test")
public class FirebaseConfig {

    private static final String CLASSPATH_PREFIX = "classpath:";

    @Value("${firebase.key-path}")
    private String firebaseKeyPath;

    @Bean
    public FirebaseApp firebaseApp() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        try (InputStream serviceAccount = getServiceAccountStream()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            return FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            log.error("[Firebase] 초기화 실패. keyPath={}", firebaseKeyPath, e);
            throw new CustomException(ErrorCode.FIREBASE_SERVER_ERROR);
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }

    private InputStream getServiceAccountStream() throws IOException {
        if (firebaseKeyPath.startsWith(CLASSPATH_PREFIX)) {
            String path = firebaseKeyPath.substring(CLASSPATH_PREFIX.length());
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                throw new CustomException(ErrorCode.FIREBASE_SERVER_ERROR);
            }
            log.info("[Firebase] classpath 키 로드: {}", path);
            return resource.getInputStream();
        }
        log.info("[Firebase] 파일시스템 키 로드: {}", firebaseKeyPath);
        return new FileInputStream(firebaseKeyPath);
    }
}
