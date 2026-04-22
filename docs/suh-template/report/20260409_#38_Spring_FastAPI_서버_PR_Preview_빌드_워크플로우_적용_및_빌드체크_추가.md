# ⚙️[기능추가][CICD] Spring/FastAPI 서버 PR Preview 빌드 워크플로우 적용 및 빌드체크 전용 명령어 추가

## 개요

passQL 레포에 Spring 백엔드와 FastAPI AI 서버 각각에 대한 **PR Preview 배포 워크플로우**를 `suh-github-template`에서 이식하고, 기존 `@suh-lab server build`(배포) 명령을 `server deploy`로 리네이밍한 뒤, **배포 없이 빌드 성공 여부만 검증**하는 `@suh-lab server build` 경량 명령어를 신규 추가했다. 두 워크플로우 모두 PR/Issue/Custom-Branch 3가지 트리거 변형을 지원하며, 총 12개 job × 2파일 = 24개 job 구성이다.

## 변경 사항

### 워크플로우 신규

- `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (2840줄): Spring Boot PR Preview + 빌드 검증 워크플로우
- `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (2735줄): FastAPI AI PR Preview + 빌드 검증 워크플로우

### 명령어 체계 (두 파일 공통)

| 명령어 | 동작 |
|--------|------|
| `@suh-lab server build` | 배포 없이 빌드 검증만 (신규) |
| `@suh-lab server deploy` | PR Preview 테스트 서버 배포 (기존 build → rename) |
| `@suh-lab server destroy` | Preview 환경 삭제 |
| `@suh-lab server status` | 현재 상태 확인 |

모든 명령어는 `@suh-lab server <cmd> <branch-name>` 형태의 custom-branch 지정도 지원한다.

### 각 파일 Job 구성 (12개)

| Job | 설명 |
|-----|------|
| `check-command` | PR 코멘트에서 `@suh-lab server` 명령 파싱 (build/deploy/destroy/status + custom branch) |
| `deploy-preview-pr` | PR 댓글 트리거 Preview 배포 |
| `get-branch-from-issue` | Issue에서 브랜치 정보 추출 |
| `deploy-preview-issue` | Issue 댓글 트리거 Preview 배포 |
| `deploy-preview-custom-branch` | 커스텀 브랜치 지정 Preview 배포 |
| `destroy-preview` | Preview 컨테이너 삭제 (PR/Issue) |
| `destroy-preview-custom-branch` | 커스텀 브랜치 Preview 삭제 |
| `check-status` | 컨테이너 상태 확인 (PR/Issue) |
| `check-status-custom-branch` | 커스텀 브랜치 상태 확인 |
| `build-verify-pr` | PR 빌드 검증 (신규) |
| `build-verify-issue` | Issue 빌드 검증 (신규) |
| `build-verify-custom-branch` | 커스텀 브랜치 빌드 검증 (신규) |

## 주요 구현 내용

### 1. 템플릿 이식 및 passQL 커스터마이징

`suh-github-template`의 PR-Preview 워크플로우를 그대로 복사한 후 env 블록을 passQL 프로젝트 구조에 맞게 치환했다.

**Spring** — `PROJECT_NAME: passql`, `JAVA_VERSION: '21'`, `SPRING_WORKING_DIR: 'server'`, `JAR_PATH: 'server/PQL-Web/build/libs/*.jar'`, Preview 포트 8079

**Python** — `PROJECT_NAME: passql-ai`, `PYTHON_VERSION: '3.13'`, `AI_WORKING_DIR: 'ai'`, `AI_ENTRYPOINT_MODULE: 'src.main'`, Docker context `./ai`, Preview 포트 8078

### 2. 명령어 리네이밍 (build → deploy)

기존 `@suh-lab server build`가 실제로는 Preview 배포를 수행하므로, `deploy`로 리네이밍하고 `build`를 빌드 검증 전용으로 확보했다. 하위 호환성은 고려하지 않는 깔끔한 전환.

- `check-command` 파싱에 `deploy` elif 분기 추가
- 3개 `build-preview-*` job → `deploy-preview-*`로 rename
- `if:` 조건의 `command == 'build'` → `command == 'deploy'` 변경
- 사용자 안내 문구/명령어 표 전체 `deploy`로 교체

### 3. 빌드 검증 (build-verify) 3종 신규

PR/Issue/Custom-Branch 각각에 대해 배포 없이 빌드만 검증하는 경량 job을 추가했다.

**Spring 빌드 검증**
- `./gradlew clean build -x test -Dspring.profiles.active=prod` (`working-directory: server`)
- `server/` 디렉토리 변경 감지 (PR variant) — 변경 없으면 스킵

**Python 빌드 검증** (Docker 미사용)
- `pip install .` → `python -m compileall -q src` → `python -c "from src.main import app"` (ai/ 디렉토리)
- `ai/` 디렉토리 변경 감지 (PR variant) — 변경 없으면 스킵

**공통 피드백**
- 리액션: 👀(수신) → ✅(성공) / ❌(실패)
- 실패 시 PR 코멘트에 에러 로그 마지막 100줄을 `<details>` 접기로 제공
- 소요 시간, 워크플로우 실행 URL 포함

## 주의사항

- Synology/Nexus 등 배포 관련 Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SERVER_HOST`, `SERVER_USER`, `SERVER_PASSWORD`, `APPLICATION_PROD_YML`, `AI_ENV_FILE`) 이 GitHub Repository Secrets에 등록되어 있어야 `deploy` 명령이 정상 작동한다
- `build` 명령(빌드 검증)은 배포 Secrets 없이도 동작 가능하나, Spring의 `APPLICATION_PROD_YML`은 빌드에 필요할 수 있음
- 실제 PR에서 12개 시나리오 (Spring/Python × build/deploy/destroy/status × PR/Issue/Custom-Branch) 동작 검증 필요
