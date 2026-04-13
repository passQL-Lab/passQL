# Spring/FastAPI PR Preview 워크플로우 이식 및 `server build` 빌드 검증 명령어 추가

- **이슈**: passQL-Lab/passQL#38
- **작성일**: 2026-04-09
- **작성자**: @Cassiiopeia
- **상태**: Design (리뷰 대기)

---

## 1. 배경

현재 passQL 레포에는 `main` 브랜치 push/PR 시 돌아가는 **자동 CI**(`PROJECT-SPRING-PASSQL-CI.yaml`, `PROJECT-PYTHON-AI-CI.yaml`)와 **배포 CICD**(`PROJECT-SPRING-SYNOLOGY-PASSQL-CICD.yaml`, `PROJECT-PYTHON-AI-CICD.yaml`)는 구축되어 있으나, **PR 단위로 임의 시점에 수동 트리거하여 테스트 서버에 배포**하거나 **배포 없이 빌드만 검증**하는 기능이 없다.

`suh-github-template`에는 `issue_comment` 기반으로 `@suh-lab server build/destroy/status` 명령어를 처리하는 PR Preview 워크플로우가 이미 검증되어 있으므로, 이를 **구조 그대로** passQL에 이식하되 passQL 모노레포 구조(`server/`, `ai/`)와 기존 CI/CD 스타일(Spring Gradle / AI Docker)에 맞게 수정한다.

이식과 동시에, **"배포 없이 빌드만 검증하는"** 신규 명령어를 추가한다. 네이밍 정리 차원에서 기존 `build`(실제로는 빌드+배포) 명령어를 `deploy`로 rename하고, 신규 빌드 검증 전용 명령어를 `build`로 둔다.

---

## 2. 최종 명령어 체계

| 명령어 | 동작 | 비고 |
|---|---|---|
| `@suh-lab server build` | 배포 없이 빌드만 검증 | **신규** |
| `@suh-lab server deploy` | PR Preview 테스트 서버에 빌드+배포 | **기존 `build`에서 rename** |
| `@suh-lab server destroy` | Preview 환경 삭제 | 기존 유지 |
| `@suh-lab server status` | 현재 상태 확인 | 기존 유지 |

모든 명령어는 뒤에 브랜치명을 선택적으로 받을 수 있다 (custom-branch 지정):

```
@suh-lab server build feat/experiment-xyz
@suh-lab server deploy hotfix/urgent-fix
```

**하위 호환성은 고려하지 않는다.** 기존 `@suh-lab server build`를 배포 의미로 쓰던 습관은 `deploy`로 대체되며, 레거시 안내도 추가하지 않는다.

---

## 3. 파일 구성

### 3.1 신규 생성 파일

```
.github/workflows/
├── PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml   (신규)
└── PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml   (신규)
```

두 파일 모두 `suh-github-template`의 원본 파일:

- `project-types/spring/synology/PROJECT-SPRING-SYNOLOGY-PR-PREVIEW.yaml` (2233줄)
- `project-types/python/synology/PROJECT-PYTHON-SYNOLOGY-PR-PREVIEW.yaml` (2117줄)

을 **구조 그대로 복사**한 뒤, passQL 맞춤 수정과 신규 `build` 명령 분기 추가만 수행한다.

### 3.2 기존 파일 (수정/삭제 없음)

- `PROJECT-SPRING-PASSQL-CI.yaml` — 유지 (main push/PR 자동 CI)
- `PROJECT-SPRING-SYNOLOGY-PASSQL-CICD.yaml` — 유지 (main 배포)
- `PROJECT-PYTHON-AI-CI.yaml` — 유지
- `PROJECT-PYTHON-AI-CICD.yaml` — 유지

신규 PR-Preview는 `issue_comment` 기반 수동 트리거 전용이라 기존 자동 CI/CD와 트리거 조건이 겹치지 않아 충돌하지 않는다.

---

## 4. Job 구조

Spring/Python 두 파일 모두 동일한 구조. 기존 템플릿의 9개 job을 유지하고 `build-verify-*` 3종을 신규 추가하여 **총 12개 job**.

```
jobs:
  check-command                    # 코멘트 파싱 (build/deploy/destroy/status 판별)
  │
  ├─ build-verify-pr               # [신규] PR에서 build → 빌드만 검증 (배포 X)
  ├─ build-verify-issue            # [신규] 이슈에서 build → 빌드만 검증
  ├─ build-verify-custom-branch    # [신규] 커스텀 브랜치 build 검증
  │
  ├─ deploy-preview-pr             # [rename] 기존 build-preview-pr
  ├─ get-branch-from-issue         # 유지
  ├─ deploy-preview-issue          # [rename] 기존 build-preview-issue
  ├─ deploy-preview-custom-branch  # [rename] 기존 build-preview-custom-branch
  │
  ├─ destroy-preview               # 유지
  ├─ destroy-preview-custom-branch # 유지
  │
  ├─ check-status                  # 유지 (server status)
  └─ check-status-custom-branch    # 유지
```

### 4.1 `check-command` 변경

코멘트 파싱 로직에 `build`/`deploy` 분기를 추가한다. `build`가 `deploy`보다 먼저 매칭되어야 하므로 정규식 순서 주의.

```bash
# 변경 후 (Spring/Python 동일)
if [[ "$COMMENT" =~ @suh-lab[[:space:]]+server[[:space:]]+build([[:space:]]+([^[:space:]]+))? ]]; then
  COMMAND="build"
  BRANCH="${BASH_REMATCH[2]}"
elif [[ "$COMMENT" =~ @suh-lab[[:space:]]+server[[:space:]]+deploy([[:space:]]+([^[:space:]]+))? ]]; then
  COMMAND="deploy"
  BRANCH="${BASH_REMATCH[2]}"
elif [[ "$COMMENT" =~ @suh-lab[[:space:]]+server[[:space:]]+destroy([[:space:]]+([^[:space:]]+))? ]]; then
  COMMAND="destroy"
  BRANCH="${BASH_REMATCH[2]}"
elif [[ "$COMMENT" =~ @suh-lab[[:space:]]+server[[:space:]]+status([[:space:]]+([^[:space:]]+))? ]]; then
  COMMAND="status"
  BRANCH="${BASH_REMATCH[2]}"
else
  COMMAND=""
fi
```

**정규식 충돌 검토**: `build` / `deploy` / `destroy` / `status` 4개 키워드는 앞 글자가 모두 다르므로(b/de/de/s) 의도치 않은 매칭 없음. `deploy`와 `destroy`는 4번째 글자부터 분기.

---

## 5. 신규 `build-verify-*` Job 상세

`deploy-preview-*` 3종을 템플릿으로 복제한 뒤 **배포 관련 스텝을 모두 제거**하고 **실제 빌드만 수행**하도록 축소한다.

### 5.1 공통 제거 항목

- SSH 키 셋업 (`webfactory/ssh-agent` 등)
- rsync를 통한 Synology NAS 전송
- 원격 docker-compose / systemctl / nginx reload
- Nexus publish
- Preview URL 생성 / 공유 댓글

### 5.2 공통 유지 항목

- 코멘트 리액션 (👀 → ✅/❌)
- 브랜치 존재 여부 확인
- paths 변경 감지 (server/ 또는 ai/ 변경 여부)
- 실제 빌드 실행 (아래 5.3, 5.4)
- 결과 댓글 1개 (성공/실패 모두)
- 에러 로그 `<details>` 접기 (마지막 100줄)
- 워크플로우 run URL 링크

### 5.3 Spring `build-verify-*` 빌드 단계

```yaml
- name: Java 21 셋업
  uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
    cache: 'gradle'

- name: Gradle wrapper 실행권한 부여
  run: chmod +x server/gradlew

- name: Gradle 빌드 검증
  working-directory: server
  run: |
    set -o pipefail
    ./gradlew clean build -x test 2>&1 | tee /tmp/build.log

- name: 에러 로그 tail 추출 (실패 시)
  if: failure()
  id: tail_log
  run: |
    TAIL=$(tail -n 100 /tmp/build.log)
    echo "log<<EOF" >> $GITHUB_OUTPUT
    echo "$TAIL" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
```

### 5.4 AI(FastAPI) `build-verify-*` 빌드 단계 — 경량 검증

**Docker는 사용하지 않는다.** 배포 전 빌드 가능성 검증만 목적이므로 다음 3단계로 충분하다:

```yaml
- name: Python 3.13 셋업
  uses: actions/setup-python@v5
  with:
    python-version: '3.13'
    cache: 'pip'

- name: .env 파일 생성
  run: |
    echo "${{ secrets.AI_ENV_FILE }}" > ai/.env

- name: 의존성 설치
  working-directory: ai
  run: |
    set -o pipefail
    pip install --upgrade pip 2>&1 | tee -a /tmp/build.log
    pip install . 2>&1 | tee -a /tmp/build.log

- name: 문법 검사 (compileall)
  working-directory: ai
  run: |
    set -o pipefail
    python -m compileall -q src 2>&1 | tee -a /tmp/build.log

- name: FastAPI 앱 import 검증
  working-directory: ai
  run: |
    set -o pipefail
    python -c "from src.main import app; print('FastAPI app import OK')" 2>&1 | tee -a /tmp/build.log

- name: 에러 로그 tail 추출 (실패 시)
  if: failure()
  id: tail_log
  run: |
    TAIL=$(tail -n 100 /tmp/build.log)
    echo "log<<EOF" >> $GITHUB_OUTPUT
    echo "$TAIL" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
```

**검증 수준**:
1. `pip install .` — `pyproject.toml` 의존성 설치 가능 여부
2. `python -m compileall src` — 전체 `.py` 구문 에러 탐지
3. `from src.main import app` — 실제 FastAPI 앱 로드 시 발생하는 import/초기화 에러 탐지

이 3단계로 Docker 빌드 없이 배포 가능성의 대부분을 검증할 수 있으며, Docker 빌드 대비 3~5배 빠르다. passQL AI 엔트리포인트는 현재 `ai/src/main.py`의 `app` 인스턴스이다.

---

## 6. 사전 점검 단계 (실제 빌드 이전)

`build-verify-*` 각 job은 빌드 실행 **전**에 다음 조건들을 차례로 검사한다. 하나라도 실패하면 실패 댓글과 함께 종료.

1. **브랜치 존재** — `github.rest.repos.getBranch`로 확인. 없으면 "브랜치를 찾을 수 없습니다" 댓글.
2. **paths 변경 감지** — PR의 changed files에 `server/**` (Spring) 또는 `ai/**` (AI) 포함 여부 확인. 미변경 시 "변경사항 없음, 스킵" 정보성 댓글 + ✅ 리액션으로 종료.
3. **필수 파일 존재** — Spring: `server/gradlew` / AI: `ai/pyproject.toml`, `ai/src/main.py`.
4. **필수 Secrets 존재** — AI 전용: `AI_ENV_FILE`이 빈 값인지 확인 (GitHub Actions에서는 직접 검증 어려우므로 `.env` 생성 후 크기 체크).

사전 점검 통과 후에만 섹션 5의 실제 빌드로 진입한다.

---

## 7. 결과 리포트 형식

리액션만 방식(👀 → ✅/❌) + 최종 결과 댓글 1개.

### 7.1 성공

```markdown
✅ **빌드 검증 성공**

| 항목 | 값 |
|------|-----|
| **대상** | Spring 서버 (`server/`) |
| **브랜치** | `20260409_#38_...` |
| **커밋** | `abc1234` |
| **빌드 시간** | 1분 42초 |

🔗 [워크플로우 로그](https://github.com/passQL-Lab/passQL/actions/runs/XXXX)
```

### 7.2 빌드 실패

```markdown
❌ **빌드 검증 실패 - Gradle 빌드 에러**

| 항목 | 값 |
|------|-----|
| **대상** | Spring 서버 (`server/`) |
| **브랜치** | `...` |
| **실패 단계** | `./gradlew clean build -x test` |

<details>
<summary>📋 에러 로그 (마지막 100줄)</summary>

```
{tail_log.outputs.log}
```

</details>

🔗 [전체 워크플로우 로그](https://github.com/passQL-Lab/passQL/actions/runs/XXXX)
```

### 7.3 사전 점검 실패 (브랜치 없음)

```markdown
❌ **빌드 검증 실패 - 브랜치를 찾을 수 없습니다**

| 항목 | 값 |
|------|-----|
| **요청된 브랜치** | `...` |
| **이슈/PR** | #38 |

### 💡 확인 사항
1. 브랜치가 원격 저장소에 push되었는지 확인하세요
2. "Guide by SUH-LAB" 댓글의 브랜치명이 올바른지 확인하세요
3. 브랜치명에 오타가 없는지 확인하세요

🔗 [워크플로우 로그](https://github.com/passQL-Lab/passQL/actions/runs/XXXX)
```

### 7.4 paths 미변경 (스킵)

```markdown
ℹ️ **빌드 검증 스킵**

Spring 서버(`server/`)에 변경사항이 없어 빌드 검증을 스킵했습니다.

🔗 [워크플로우 로그](https://github.com/passQL-Lab/passQL/actions/runs/XXXX)
```

---

## 8. passQL 맞춤 수정 포인트

| 항목 | 템플릿 원본 | passQL 값 |
|---|---|---|
| **Spring 작업 디렉토리** | `.` | `server/` |
| **Gradle wrapper 경로** | `./gradlew` | `server/gradlew` |
| **Java 버전** | 템플릿 기본 | `21` |
| **Application yml 경로** | 템플릿 기본 | `server/PQL-Web/src/main/resources` |
| **AI 작업 디렉토리** | `.` | `ai/` |
| **Python 버전** | 템플릿 | `3.13` |
| **AI 빌드 방식** | pip/venv or docker | **pip install + compileall + import** (Docker 미사용) |
| **AI 엔트리포인트** | `main:app` | `src.main:app` |
| **AI `.env` 생성** | 템플릿 방식 | `secrets.AI_ENV_FILE` (기존 CI와 동일) |
| **Synology Secrets** | 템플릿 이름 | 기존 passQL CICD에서 쓰던 secret 이름 재사용 (deploy job 한정) |
| **Preview 호스트/포트** | 템플릿 기본 | passQL 전용 subdomain (deploy job 한정) |

**주의**: deploy job 쪽(rename된 기존 로직)은 passQL 기존 `SYNOLOGY-PASSQL-CICD` / `PYTHON-AI-CICD`에서 사용하는 Secret 이름·호스트 정보를 그대로 재사용한다. 신규 Secret 등록은 필요 없도록 설계.

---

## 9. 작업 내용 체크리스트

- [ ] `PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` 생성 (템플릿 복사 + 맞춤)
  - [ ] `check-command` 에 `build`/`deploy` 분기 추가
  - [ ] 기존 `build-preview-*` 3종을 `deploy-preview-*` 로 rename
  - [ ] 신규 `build-verify-pr` job 추가
  - [ ] 신규 `build-verify-issue` job 추가
  - [ ] 신규 `build-verify-custom-branch` job 추가
  - [ ] passQL `server/` 경로, Java 21, gradlew 경로 반영
  - [ ] 결과 댓글 템플릿(7.1~7.4) 반영
- [ ] `PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` 생성 (템플릿 복사 + 맞춤)
  - [ ] `check-command` 동일 변경
  - [ ] `deploy-preview-*` rename
  - [ ] 신규 `build-verify-*` 3종 추가 (Docker 미사용, pip + compileall + import)
  - [ ] passQL `ai/` 경로, Python 3.13, `src.main:app` 반영
  - [ ] `.env` 파일 생성 로직 (`secrets.AI_ENV_FILE`)
  - [ ] 결과 댓글 템플릿 반영
- [ ] 실제 PR에서 `@suh-lab server build`, `@suh-lab server deploy`, `@suh-lab server destroy`, `@suh-lab server status` 각각 동작 검증
- [ ] 커스텀 브랜치 문법 `@suh-lab server build <branch>` 동작 검증
- [ ] 사전 점검 실패 케이스(브랜치 없음, paths 미변경) 시나리오 검증
- [ ] 실제 빌드 실패 케이스(고의로 컴파일 에러 삽입) 시나리오 검증

---

## 10. 범위 외 (Out of Scope)

- suh-github-template 원본 레포의 수정 (template 쪽은 별도 이슈에서 다룸)
- `docs/` 하위 사용법 가이드 문서 작성 (별도 후속 이슈로 분리)
- React 클라이언트(`client/`)에 대한 Preview/Verify 명령어
- 신규 Secrets 등록 (기존 CICD Secret 재사용)
- 빌드 결과 아티팩트 업로드
