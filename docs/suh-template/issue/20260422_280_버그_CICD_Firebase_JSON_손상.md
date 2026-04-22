---
title: "❗[버그][CI/CD] GitHub Actions echo 명령으로 Firebase JSON 손상 — 서버 기동 불가"
label: 작업전
assignee: Cassiiopeia
---

🗒️ 설명
---

GitHub Actions 배포 워크플로우에서 `echo`로 시크릿을 파일에 쓸 때 shell이 큰따옴표(`"`)를 제거해 `firebase-service-account.json`이 유효하지 않은 JSON으로 저장된다.
그 결과 Spring Boot 기동 시 Firebase SDK가 파싱에 실패하고 서버 전체가 뜨지 않는다. CORS 에러는 서버가 죽어있어 preflight에 응답을 못 하는 2차 증상이다.

🔄 재현 방법
---

1. `deploy` 브랜치에 push하여 GitHub Actions 배포 워크플로우 실행
2. Docker 컨테이너 내부 `app.jar`에서 `BOOT-INF/classes/firebase-service-account.json` 추출
3. 파일 내용 확인 — 키/값에 큰따옴표가 없는 `{type: service_account, ...}` 형태로 저장됨
4. `docker logs passql-back` 확인 → `MalformedJsonException: ... at line 2 column 4 path $.`

📸 참고 자료
---

**Docker 로그 에러:**
```
com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT)
to accept malformed JSON at line 2 column 4 path $.
```

**실제 파일 내용 (손상 후):**
```
{
  type: service_account,
  project_id: passql,
  ...
```

**정상 JSON이어야 하는 형태:**
```json
{
  "type": "service_account",
  "project_id": "passql",
  ...
```

**문제 코드** (`.github/workflows/PROJECT-SPRING-SERVER-DEPLOY.yml:28`):
```yaml
echo "${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }}" \
  > server/PQL-Web/src/main/resources/firebase-service-account.json
```

✅ 예상 동작
---

- `firebase-service-account.json`이 원본 JSON 형식 그대로 classpath에 포함되어야 함
- Spring Boot 기동 시 Firebase SDK가 정상 초기화되어야 함
- `https://api.passql.suhsaechan.kr/api/auth/login` 요청이 정상 응답해야 함

⚙️ 환경 정보
---

- **OS**: Ubuntu (GitHub Actions runner)
- **배포 방식**: GitHub Actions → DockerHub → Synology NAS
- **관련 파일**: `.github/workflows/PROJECT-SPRING-SERVER-DEPLOY.yml`
- **관련 코드**: `server/PQL-Web/src/main/java/com/passql/web/config/FirebaseConfig.java`

🙋‍♂️ 담당자
---

- **백엔드**: Cassiiopeia
