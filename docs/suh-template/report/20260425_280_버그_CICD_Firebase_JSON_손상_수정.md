# ❗[버그][CICD] GitHub Actions echo 명령으로 Firebase JSON 손상 — 서버 기동 불가

## 개요

GitHub Actions 배포 워크플로우에서 `echo`로 시크릿을 파일에 쓸 때 shell이 큰따옴표(`"`)를 제거해 `firebase-service-account.json`이 유효하지 않은 JSON으로 저장되는 버그를 수정했다. `echo` 명령 전체를 `printf '%s'`로 교체하여 시크릿 원문이 그대로 파일에 저장되도록 했으며, 추가로 발견된 NAS SSH 포트 누락과 docker 실행 경로 문제도 함께 수정했다. 임시 워크플로우 파일은 정리하여 기존 메인 CICD 파일로 단일화했다.

## 변경 사항

### GitHub Actions 워크플로우 수정

- `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-CICD.yaml`: `echo`를 `printf '%s'`로 교체 — `application-prod.yml` 및 `firebase-service-account.json` 생성 단계 모두 적용

### 임시 워크플로우 추가 후 제거 (작업 중 생성, 최종 삭제)

- `.github/workflows/PROJECT-SPRING-SERVER-DEPLOY.yml`: 디버깅용으로 작성, 동일한 `printf '%s'` 패턴 및 NAS SSH 포트(`2022`) · docker 전체 경로(`/volume1/@appstore/ContainerManager/usr/bin/docker`) 수정 검증 후 삭제

## 주요 구현 내용

### 핵심 원인 및 수정

shell의 `echo "${{ secrets.SOME_JSON }}"` 구문은 큰따옴표를 자동 제거하는 shell expansion 동작으로 인해 JSON 내의 모든 `"key": "value"` 표현이 `key: value` 형태로 손상된다. Spring Boot 기동 시 Firebase SDK(Gson)가 이 손상된 파일을 파싱하지 못해 `MalformedJsonException`이 발생하고 서버 전체가 기동 불가 상태가 됐다. CORS 에러는 서버가 죽어 preflight 응답을 못 하는 2차 증상이었다.

**수정 전:**
```yaml
echo "${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }}" > ./.../.../firebase-service-account.json
```

**수정 후:**
```yaml
printf '%s' '${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }}' > ./.../.../firebase-service-account.json
```

`printf '%s'`는 shell expansion 없이 인자를 그대로 출력하므로 JSON 내 큰따옴표가 보존된다.

### 추가 수정 사항 (임시 워크플로우 검증 중 발견)

| 항목 | 문제 | 수정 |
|------|------|------|
| SSH 포트 | 기본 포트 22 사용 — NAS는 2022 | `port: 2022` 명시 |
| docker 실행 경로 | `docker` 명령이 PATH에 없음 | `/volume1/@appstore/ContainerManager/usr/bin/docker` 전체 경로 사용 |

이 두 문제는 임시 워크플로우(`PROJECT-SPRING-SERVER-DEPLOY.yml`)에서 검증 후 확인했으며, 해당 파일은 최종적으로 삭제하고 기존 `PROJECT-SPRING-SYNOLOGY-PASSQL-CICD.yaml` 하나로 유지했다.

## 관련 커밋

| 커밋 | 내용 |
|------|------|
| `a9b8a38` | 임시 워크플로우 추가 + printf 수정 |
| `72bc648` | NAS SSH 포트 2022, docker 전체 경로 수정 |
| `4255f9f` | 메인 CICD 파일(`PROJECT-SPRING-SYNOLOGY-PASSQL-CICD.yaml`)에 printf 적용 |
| `1add0bd` | 임시 워크플로우 파일 제거 (메인 파일로 단일화) |

## 주의사항

- `printf '%s' '${{ secrets.XXX }}'`에서 시크릿 참조를 **작은따옴표**로 감싸는 것이 핵심이다. 큰따옴표로 감싸면 shell이 개입해 동일한 문제가 재발할 수 있다.
- Synology NAS에서 docker 명령은 PATH에 등록되지 않으므로 GitHub Actions ssh-action에서 실행 시 반드시 전체 경로를 사용해야 한다.
