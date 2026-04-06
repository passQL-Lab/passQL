# ===================================================================
# passQL Spring Boot Dockerfile
# ===================================================================
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="passQL Team"
LABEL description="passQL Backend API Server"

WORKDIR /app

ENV TZ=Asia/Seoul
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

COPY PQL-Web/build/libs/app.jar app.jar

HEALTHCHECK --interval=43200s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
