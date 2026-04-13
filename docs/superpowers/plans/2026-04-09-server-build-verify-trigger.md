# Spring/FastAPI PR Preview 워크플로우 이식 및 `server build` 검증 명령어 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `suh-github-template`의 Spring/Python Synology PR-Preview 워크플로우 2개를 passQL에 이식하고, 배포 없이 빌드만 검증하는 `@suh-lab server build` 명령어를 새로 추가한다. 기존 `build` 명령어는 `deploy`로 rename (하위 호환 없음).

**Architecture:** 템플릿 원본 2개 파일(각 2000+ 줄)을 passQL로 **그대로 복사**한 뒤, (1) `check-command` 파싱 로직에 `build`/`deploy` 분기 추가, (2) 기존 `build-preview-*` 3종 job을 `deploy-preview-*`로 rename, (3) 신규 `build-verify-*` 3종 job을 추가한다. Spring은 `./gradlew clean build -x test`로, AI는 Docker 없이 `pip install . + compileall + app import` 경량 검증.

**Tech Stack:** GitHub Actions (YAML), actions/github-script@v7, Gradle 8 + Java 21, Python 3.13 + FastAPI + uvicorn, bash 정규식

**Spec:** [`docs/superpowers/specs/2026-04-09-server-build-verify-trigger-design.md`](../specs/2026-04-09-server-build-verify-trigger-design.md)
**Issue:** passQL-Lab/passQL#38

---

## File Structure

### 생성되는 파일

| 경로 | 크기 | 책임 |
|---|---|---|
| `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` | ~2400 줄 | Spring 서버(`server/`)의 PR Preview 배포 + 신규 빌드 검증 |
| `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` | ~2300 줄 | FastAPI AI(`ai/`)의 PR Preview 배포 + 신규 빌드 검증 |

### 수정/삭제되는 파일

없음. 기존 `PROJECT-SPRING-PASSQL-CI.yaml`, `PROJECT-SPRING-SYNOLOGY-PASSQL-CICD.yaml`, `PROJECT-PYTHON-AI-CI.yaml`, `PROJECT-PYTHON-AI-CICD.yaml`은 모두 유지.

### 참조할 원본

| 원본 경로 | 용도 |
|---|---|
| `D:/0-suh/project/suh-github-template/.github/workflows/project-types/spring/synology/PROJECT-SPRING-SYNOLOGY-PR-PREVIEW.yaml` | Spring 신규 파일 베이스 |
| `D:/0-suh/project/suh-github-template/.github/workflows/project-types/python/synology/PROJECT-PYTHON-SYNOLOGY-PR-PREVIEW.yaml` | Python 신규 파일 베이스 |

---

## 작업 개요 및 순서

1. **Task 1**: Spring 템플릿을 passQL로 복사 (첫 커밋)
2. **Task 2**: Spring `env` 섹션을 passQL 값으로 치환
3. **Task 3**: Spring `check-command`에 `deploy` 분기 추가 (rename 준비)
4. **Task 4**: Spring 기존 `build-preview-*` 3종 job을 `deploy-preview-*`로 rename 및 조건 수정
5. **Task 5**: Spring 신규 `build-verify-*` 3종 job 추가 (Gradle 경량 빌드)
6. **Task 6**: Spring 파일 내부 사용자 안내 문구(`@suh-lab server build` → `@suh-lab server deploy`) 교체
7. **Task 7**: Python 템플릿을 passQL로 복사
8. **Task 8**: Python `env` 섹션을 passQL 값으로 치환
9. **Task 9**: Python `check-command`에 `deploy` 분기 추가
10. **Task 10**: Python 기존 `build-preview-*` 3종 job을 `deploy-preview-*`로 rename
11. **Task 11**: Python 신규 `build-verify-*` 3종 job 추가 (pip + compileall + import)
12. **Task 12**: Python 파일 내부 사용자 안내 문구 교체
13. **Task 13**: 실제 PR 생성 후 수동 검증 시나리오 수행

각 Task는 독립된 커밋. 모든 변경은 단일 브랜치(`20260409_#38_Spring_FastAPI_서버_PR_Preview_빌드_워크플로우_적용_및_빌드체크_전용_명령어_추가`)에서 진행.

---

## Task 1: Spring 템플릿 파일을 passQL로 복사

**Files:**
- Create: `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml`
- Read: `D:/0-suh/project/suh-github-template/.github/workflows/project-types/spring/synology/PROJECT-SPRING-SYNOLOGY-PR-PREVIEW.yaml`

- [ ] **Step 1: 원본 파일 전체를 passQL로 복사**

원본 파일이 2233줄로 매우 크므로, Read 도구로 여러 번 나눠 읽은 뒤 Write 도구로 한 번에 저장한다. 또는 bash `cp` 명령 사용:

```bash
cp "D:/0-suh/project/suh-github-template/.github/workflows/project-types/spring/synology/PROJECT-SPRING-SYNOLOGY-PR-PREVIEW.yaml" "D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml"
```

- [ ] **Step 2: 복사 결과 라인 수 확인**

```bash
wc -l D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```
Expected: `2233` 줄

- [ ] **Step 3: 커밋**

```bash
cd D:/0-suh/project/passQL
git add .github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Spring Synology PR-Preview 템플릿 원본 이식 (passQL) #38"
```

---

## Task 2: Spring `env` 섹션을 passQL 값으로 치환

**Files:**
- Modify: `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (L28~74)

**Context:** 원본의 `env` 섹션은 `suh-project-utility`(Java 17, 루트 디렉토리 기반)로 세팅되어 있음. passQL은 `server/` 하위에 Spring 프로젝트가 있고 Java 21, 모듈명 `PQL-Web` 사용.

- [ ] **Step 1: `name` 필드 교체**

L28의 `name: PROJECT-SPRING-SYNOLOGY-PR-PREVIEW`를 `name: PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW`로 변경.

- [ ] **Step 2: `env` 섹션 치환**

L33~74의 `env:` 블록을 아래로 교체한다:

```yaml
env:
  # 프로젝트 고유 식별자 (컨테이너명, 이미지명, 도메인에 사용)
  PROJECT_NAME: passql

  # Spring Boot 빌드 설정 (passQL: server/ 하위, Java 21)
  JAVA_VERSION: '21'
  GRADLE_BUILD_CMD: './gradlew clean build -x test -Dspring.profiles.active=prod'
  JAR_PATH: 'server/PQL-Web/build/libs/*.jar'
  APPLICATION_YML_PATH: 'server/PQL-Web/src/main/resources/application-prod.yml'
  SPRING_WORKING_DIR: 'server'

  # Docker 설정
  DOCKERFILE_PATH: './server/Dockerfile'
  INTERNAL_PORT: '8080'

  # 🗂️ 볼륨 마운트 설정 (빈값이면 마운트 안함)
  PROJECT_TARGET_DIR: ""
  PROJECT_MNT_DIR: ""

  # Traefik & Preview 도메인 설정
  TRAEFIK_NETWORK: traefik-network
  PREVIEW_DOMAIN_SUFFIX: pr.suhsaechan.kr
  PREVIEW_PORT: '8079'

  # SSH 포트
  SSH_PORT: '2022'

  # Issue Helper 댓글 마커
  ISSUE_HELPER_MARKER: 'Guide by SUH-LAB'

  # Health Check 설정
  HEALTH_CHECK_PATH: '/actuator/health'
  HEALTH_CHECK_LOG_PATTERN: 'Started .* in [0-9.]+ seconds'
  API_DOCS_PATH: '/swagger-ui/index.html'

  # 빌드 검증 로그 보존 경로 (build-verify-* job 전용)
  BUILD_LOG_PATH: '/tmp/build.log'
```

**주의**: `SPRING_WORKING_DIR`, `BUILD_LOG_PATH`는 passQL 신규 변수. 기존 `JAR_PATH`, `APPLICATION_YML_PATH`는 `server/` 프리픽스를 포함한다.

- [ ] **Step 3: `gradlew` 실행권한 부여 step 수정**

원본 L254~255:
```yaml
- name: Gradle 권한 설정
  run: chmod +x gradlew
```
를 다음으로 교체:
```yaml
- name: Gradle 권한 설정
  run: chmod +x server/gradlew
```

**이 변경은 현재 파일 내 모든 `chmod +x gradlew` 발생 지점에 동일하게 적용**한다. Grep으로 위치 확인:

```bash
grep -n "chmod +x gradlew" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 발생 지점을 `chmod +x server/gradlew`로 수정.

- [ ] **Step 4: Gradle 빌드 실행 step에 `working-directory` 또는 경로 접두어 추가**

원본에서 `./gradlew` 또는 `${{ env.GRADLE_BUILD_CMD }}`를 실행하는 step들을 찾는다:

```bash
grep -n "GRADLE_BUILD_CMD\|./gradlew" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 `run:` 블록 앞에 `working-directory: server` 추가하거나, `cd server && ${{ env.GRADLE_BUILD_CMD }}` 형태로 수정. **일관성을 위해 `working-directory: server` 방식을 사용한다.**

- [ ] **Step 5: 커밋**

```bash
git add .github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Spring PR-Preview env/경로를 passQL 구조로 맞춤 #38"
```

---

## Task 3: Spring `check-command`에 `deploy` 분기 추가

**Files:**
- Modify: `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (L138~176, `check-command` job 내부 파싱 블록)

**Context:** 현재 파싱은 `build`/`destroy`/`status` 3종. `deploy` 분기를 추가하되, **`build`의 의미는 이 Task에서 아직 유지**(실제 rename은 Task 4에서 수행). 이 Task는 파싱 단계만 준비.

- [ ] **Step 1: 파싱 블록 위치 확인**

```bash
grep -n "command=build\|command=destroy\|command=status" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

Expected: L141, L152, L163 근처 (원본 기준).

- [ ] **Step 2: `build` 분기 아래에 `deploy` 분기 신규 추가**

L150 (원본 기준 `echo "✅ 명령어 감지: build"` 이후, `elif ... destroy` 이전)에 아래 블록을 삽입:

```bash
          elif [[ "$COMMENT" =~ @suh-lab[[:space:]]+server[[:space:]]+deploy([[:space:]]+([^[:space:]]+))? ]]; then
            echo "command=deploy" >> $GITHUB_OUTPUT
            echo "is_valid=true" >> $GITHUB_OUTPUT
            if [[ -n "${BASH_REMATCH[2]}" ]]; then
              echo "custom_branch=${BASH_REMATCH[2]}" >> $GITHUB_OUTPUT
              echo "is_custom_branch=true" >> $GITHUB_OUTPUT
              echo "✅ 명령어 감지: deploy (브랜치: ${BASH_REMATCH[2]})"
            else
              echo "is_custom_branch=false" >> $GITHUB_OUTPUT
              echo "✅ 명령어 감지: deploy"
            fi
```

**순서 주의**: `build`가 `deploy`보다 먼저 매칭되도록 유지. 두 키워드는 문자열이 달라 충돌 없음.

- [ ] **Step 3: 파싱 블록 최종 상태 검증**

```bash
grep -n "command=" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```
Expected: `command=build`, `command=deploy`, `command=destroy`, `command=status` 네 줄이 모두 존재.

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Spring check-command에 deploy 분기 추가 #38"
```

---

## Task 4: Spring `build-preview-*` → `deploy-preview-*` rename

**Files:**
- Modify: `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (L181, L794, L1569 부근)

**Context:** 기존 3종 job(`build-preview-pr`, `build-preview-issue`, `build-preview-custom-branch`)의 **이름**과 **`if:` 조건**을 수정한다. 하위 호환성 없이 `build` → `deploy`로 완전 전환.

- [ ] **Step 1: job 이름 3곳 rename**

아래 3개를 찾아 수정:

```bash
grep -n "^  build-preview-" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 매칭을:
- `build-preview-pr:` → `deploy-preview-pr:`
- `build-preview-issue:` → `deploy-preview-issue:`
- `build-preview-custom-branch:` → `deploy-preview-custom-branch:`

로 수정.

- [ ] **Step 2: `name:` 필드 3곳 수정**

각 job의 `name:` 필드를 수정:
- `name: Preview 빌드 & 배포 (PR)` → `name: Preview 빌드 & 배포 (PR, deploy)`
- `name: Preview 빌드 & 배포 (Issue)` → `name: Preview 빌드 & 배포 (Issue, deploy)`
- `name: Preview 빌드 & 배포 (Custom Branch)` → `name: Preview 빌드 & 배포 (Custom Branch, deploy)`

- [ ] **Step 3: `if:` 조건에서 `command == 'build'`를 `command == 'deploy'`로 수정**

위 3개 job 내부 `if:` 블록을 찾아서 `needs.check-command.outputs.command == 'build'`를 `needs.check-command.outputs.command == 'deploy'`로 수정.

```bash
grep -n "command == 'build'" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

이 매칭 중 **deploy-preview-* 3개 job에 속한 것만** `'deploy'`로 수정. `destroy`/`status` job에서 `build` 실패 안내 메시지 렌더링을 위해 참조하는 곳은 건드리지 않는다 (Step 4에서 별도 처리).

- [ ] **Step 4: `needs:` 의존성 체인 이름 수정**

`deploy-preview-issue`는 `get-branch-from-issue`에 의존. `needs: [check-command, get-branch-from-issue]` 부분은 그대로 유지(job 이름 건드리지 않음).

`destroy-preview`, `check-status` 등이 `needs: [build-preview-pr, ...]` 같은 형태로 참조하는 경우가 있는지 확인:
```bash
grep -n "needs: .*build-preview" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```
매칭되면 `build-preview-*` → `deploy-preview-*`로 수정. 매칭 없으면 스킵.

- [ ] **Step 5: `destroy-preview` job의 트리거 조건 확인**

원본 L1367 부근:
```yaml
(github.event_name == 'issue_comment' && contains(github.event.comment.body, '@suh-lab') && contains(github.event.comment.body, 'server destroy'))
```

이 부분은 그대로 유지 (`server destroy`는 변경 없음).

- [ ] **Step 6: 커밋**

```bash
git add .github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "refactor: Spring build-preview-* 를 deploy-preview-* 로 rename #38"
```

---

## Task 5: Spring 신규 `build-verify-*` 3종 job 추가

**Files:**
- Modify: `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (파일 끝 부근에 추가)

**Context:** Task 4에서 rename한 `deploy-preview-*` 3종 이후에, **배포 없이 빌드만 검증**하는 신규 job 3종을 추가한다. Gradle `clean build -x test`만 실행하고 SSH/rsync/Docker push 전부 생략.

- [ ] **Step 1: 파일 끝 위치 확인**

파일 맨 아래 job 다음에 추가할 것이므로 기존 마지막 job(`check-status-custom-branch`) 끝 위치 확인:
```bash
grep -n "^  [a-z]" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml | tail -20
```

- [ ] **Step 2: `build-verify-pr` job 추가**

파일 맨 끝(마지막 job 이후)에 다음 블록 추가:

```yaml
  # -----------------------------------------------------------------
  # Job: 빌드 검증 (PR 댓글) - 배포 없이 Gradle 빌드만 수행
  # -----------------------------------------------------------------
  build-verify-pr:
    name: 빌드 검증 (PR)
    needs: check-command
    if: |
      needs.check-command.outputs.is_valid == 'true' &&
      needs.check-command.outputs.command == 'build' &&
      needs.check-command.outputs.is_pr == 'true' &&
      needs.check-command.outputs.is_custom_branch != 'true'
    runs-on: ubuntu-latest
    steps:
      - name: PR 정보 가져오기
        id: pr
        uses: actions/github-script@v7
        with:
          script: |
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });
            core.setOutput('ref', pr.data.head.ref);
            core.setOutput('sha', pr.data.head.sha.substring(0, 7));

      - name: 코드 체크아웃
        uses: actions/checkout@v5
        with:
          ref: ${{ steps.pr.outputs.ref }}
          fetch-depth: 0

      - name: server/ 변경 감지
        id: changes
        uses: actions/github-script@v7
        with:
          script: |
            const files = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              per_page: 300
            });
            const changed = files.data.some(f => f.filename.startsWith('server/'));
            core.setOutput('server_changed', changed.toString());
            console.log(`server/ changed: ${changed}`);

      - name: server/ 미변경 시 스킵 안내
        if: steps.changes.outputs.server_changed != 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                'ℹ️ **빌드 검증 스킵**',
                '',
                'Spring 서버(`server/`)에 변경사항이 없어 빌드 검증을 스킵했습니다.',
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });

      - name: JDK 설정
        if: steps.changes.outputs.server_changed == 'true'
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}
          cache: 'gradle'

      - name: Gradle 권한 설정
        if: steps.changes.outputs.server_changed == 'true'
        run: chmod +x server/gradlew

      - name: application-prod.yml 생성
        if: steps.changes.outputs.server_changed == 'true'
        run: |
          mkdir -p $(dirname ${{ env.APPLICATION_YML_PATH }})
          cat << 'EOF' > ${{ env.APPLICATION_YML_PATH }}
          ${{ secrets.APPLICATION_PROD_YML }}
          EOF

      - name: 빌드 시작 시각 기록
        if: steps.changes.outputs.server_changed == 'true'
        id: timer
        run: echo "start=$(date +%s)" >> $GITHUB_OUTPUT

      - name: Gradle 빌드 검증
        if: steps.changes.outputs.server_changed == 'true'
        id: build
        working-directory: server
        run: |
          set -o pipefail
          ./gradlew clean build -x test -Dspring.profiles.active=prod 2>&1 | tee ${{ env.BUILD_LOG_PATH }}

      - name: 빌드 종료 시각 기록 및 경과 시간 계산
        if: steps.changes.outputs.server_changed == 'true' && always()
        id: elapsed
        run: |
          END=$(date +%s)
          START=${{ steps.timer.outputs.start }}
          DIFF=$((END - START))
          MIN=$((DIFF / 60))
          SEC=$((DIFF % 60))
          echo "elapsed=${MIN}분 ${SEC}초" >> $GITHUB_OUTPUT

      - name: 에러 로그 tail 추출 (실패 시)
        if: steps.changes.outputs.server_changed == 'true' && failure()
        id: tail_log
        run: |
          TAIL=$(tail -n 100 ${{ env.BUILD_LOG_PATH }} 2>/dev/null || echo "(로그 파일 없음)")
          {
            echo "log<<ENDOFLOG"
            echo "$TAIL"
            echo "ENDOFLOG"
          } >> $GITHUB_OUTPUT

      - name: 성공 댓글 작성
        if: steps.changes.outputs.server_changed == 'true' && success()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.pr.outputs.ref }}';
            const sha = '${{ steps.pr.outputs.sha }}';
            const elapsed = '${{ steps.elapsed.outputs.elapsed }}';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '✅ **빌드 검증 성공**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | Spring 서버 (`server/`) |',
                `| **브랜치** | \`${ref}\` |`,
                `| **커밋** | \`${sha}\` |`,
                `| **빌드 시간** | ${elapsed} |`,
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });

      - name: 실패 댓글 작성
        if: steps.changes.outputs.server_changed == 'true' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.pr.outputs.ref }}';
            const log = `${{ steps.tail_log.outputs.log }}`;
            const body = [
              '❌ **빌드 검증 실패 - Gradle 빌드 에러**',
              '',
              '| 항목 | 값 |',
              '|------|-----|',
              '| **대상** | Spring 서버 (`server/`) |',
              `| **브랜치** | \`${ref}\` |`,
              '| **실패 단계** | `./gradlew clean build -x test` |',
              '',
              '<details>',
              '<summary>📋 에러 로그 (마지막 100줄)</summary>',
              '',
              '```',
              log,
              '```',
              '',
              '</details>',
              '',
              `🔗 [전체 워크플로우 로그](${runUrl})`
            ].join('\n');
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: body
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '-1'
            });
```

- [ ] **Step 3: `build-verify-issue` job 추가**

Step 2의 `build-verify-pr` 바로 다음에 아래 블록 추가. `get-branch-from-issue`를 `needs`로 참조하고, PR이 아니므로 `pulls.listFiles` 대신 `repos.compareCommits`로 변경 감지:

```yaml
  # -----------------------------------------------------------------
  # Job: 빌드 검증 (Issue 댓글) - 배포 없이 Gradle 빌드만 수행
  # -----------------------------------------------------------------
  build-verify-issue:
    name: 빌드 검증 (Issue)
    needs: [check-command, get-branch-from-issue]
    if: |
      needs.check-command.outputs.is_valid == 'true' &&
      needs.check-command.outputs.command == 'build' &&
      needs.check-command.outputs.is_pr == 'false' &&
      needs.check-command.outputs.is_custom_branch != 'true'
    runs-on: ubuntu-latest
    steps:
      - name: 브랜치 존재 여부 확인
        id: check_branch
        uses: actions/github-script@v7
        with:
          script: |
            const branch = '${{ needs.get-branch-from-issue.outputs.branch }}';
            try {
              await github.rest.repos.getBranch({
                owner: context.repo.owner,
                repo: context.repo.repo,
                branch: branch
              });
              core.setOutput('exists', 'true');
              core.setOutput('ref', branch);
            } catch (e) {
              core.setOutput('exists', 'false');
              core.setOutput('errorMessage', e.status === 404 ? `브랜치 \`${branch}\` 를 찾을 수 없습니다.` : e.message);
            }

      - name: 브랜치 없음 에러 댓글
        if: steps.check_branch.outputs.exists != 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const msg = '${{ steps.check_branch.outputs.errorMessage }}';
            const branch = '${{ needs.get-branch-from-issue.outputs.branch }}';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '❌ **빌드 검증 실패 - 브랜치를 찾을 수 없습니다**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                `| **요청된 브랜치** | \`${branch}\` |`,
                `| **이슈** | #${context.issue.number} |`,
                '',
                '### 💡 확인 사항',
                '1. 브랜치가 원격 저장소에 push되었는지 확인하세요',
                '2. "Guide by SUH-LAB" 댓글의 브랜치명이 올바른지 확인하세요',
                '3. 브랜치명에 오타가 없는지 확인하세요',
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '-1'
            });
            core.setFailed(msg);

      - name: 코드 체크아웃
        if: steps.check_branch.outputs.exists == 'true'
        uses: actions/checkout@v5
        with:
          ref: ${{ steps.check_branch.outputs.ref }}

      - name: JDK 설정
        if: steps.check_branch.outputs.exists == 'true'
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}
          cache: 'gradle'

      - name: Gradle 권한 설정
        if: steps.check_branch.outputs.exists == 'true'
        run: chmod +x server/gradlew

      - name: application-prod.yml 생성
        if: steps.check_branch.outputs.exists == 'true'
        run: |
          mkdir -p $(dirname ${{ env.APPLICATION_YML_PATH }})
          cat << 'EOF' > ${{ env.APPLICATION_YML_PATH }}
          ${{ secrets.APPLICATION_PROD_YML }}
          EOF

      - name: 빌드 시작 시각 기록
        if: steps.check_branch.outputs.exists == 'true'
        id: timer
        run: echo "start=$(date +%s)" >> $GITHUB_OUTPUT

      - name: Gradle 빌드 검증
        if: steps.check_branch.outputs.exists == 'true'
        id: build
        working-directory: server
        run: |
          set -o pipefail
          ./gradlew clean build -x test -Dspring.profiles.active=prod 2>&1 | tee ${{ env.BUILD_LOG_PATH }}

      - name: 빌드 종료 시각 및 경과 시간
        if: steps.check_branch.outputs.exists == 'true' && always()
        id: elapsed
        run: |
          END=$(date +%s)
          START=${{ steps.timer.outputs.start }}
          DIFF=$((END - START))
          MIN=$((DIFF / 60))
          SEC=$((DIFF % 60))
          echo "elapsed=${MIN}분 ${SEC}초" >> $GITHUB_OUTPUT

      - name: 에러 로그 tail
        if: steps.check_branch.outputs.exists == 'true' && failure()
        id: tail_log
        run: |
          TAIL=$(tail -n 100 ${{ env.BUILD_LOG_PATH }} 2>/dev/null || echo "(로그 파일 없음)")
          {
            echo "log<<ENDOFLOG"
            echo "$TAIL"
            echo "ENDOFLOG"
          } >> $GITHUB_OUTPUT

      - name: 성공 댓글
        if: steps.check_branch.outputs.exists == 'true' && success()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.check_branch.outputs.ref }}';
            const elapsed = '${{ steps.elapsed.outputs.elapsed }}';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '✅ **빌드 검증 성공**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | Spring 서버 (`server/`) |',
                `| **브랜치** | \`${ref}\` |`,
                `| **빌드 시간** | ${elapsed} |`,
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });

      - name: 실패 댓글
        if: steps.check_branch.outputs.exists == 'true' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.check_branch.outputs.ref }}';
            const log = `${{ steps.tail_log.outputs.log }}`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '❌ **빌드 검증 실패 - Gradle 빌드 에러**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | Spring 서버 (`server/`) |',
                `| **브랜치** | \`${ref}\` |`,
                '| **실패 단계** | `./gradlew clean build -x test` |',
                '',
                '<details>',
                '<summary>📋 에러 로그 (마지막 100줄)</summary>',
                '',
                '```',
                log,
                '```',
                '',
                '</details>',
                '',
                `🔗 [전체 워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '-1'
            });
```

**주의**: `needs.get-branch-from-issue.outputs.branch`는 원본 `get-branch-from-issue` job의 출력 필드명과 일치해야 한다. Task 실행 전 아래로 확인:

```bash
grep -n "get-branch-from-issue:" -A 20 D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml | head -40
```

출력 필드명이 다르면 `${{ needs.get-branch-from-issue.outputs.<실제필드명> }}`로 교체.

- [ ] **Step 4: `build-verify-custom-branch` job 추가**

Step 3 다음에 추가. custom-branch는 `check-command`에서 파싱한 `custom_branch` 출력을 사용:

```yaml
  # -----------------------------------------------------------------
  # Job: 빌드 검증 (Custom Branch) - 배포 없이 Gradle 빌드만 수행
  # -----------------------------------------------------------------
  build-verify-custom-branch:
    name: 빌드 검증 (Custom Branch)
    needs: check-command
    if: |
      needs.check-command.outputs.is_valid == 'true' &&
      needs.check-command.outputs.command == 'build' &&
      needs.check-command.outputs.is_custom_branch == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: 브랜치 존재 여부 확인
        id: check_branch
        uses: actions/github-script@v7
        with:
          script: |
            const branch = '${{ needs.check-command.outputs.custom_branch }}';
            try {
              await github.rest.repos.getBranch({
                owner: context.repo.owner,
                repo: context.repo.repo,
                branch: branch
              });
              core.setOutput('exists', 'true');
              core.setOutput('ref', branch);
            } catch (e) {
              core.setOutput('exists', 'false');
              core.setOutput('errorMessage', e.status === 404 ? `브랜치 \`${branch}\` 를 찾을 수 없습니다.` : e.message);
            }

      - name: 브랜치 없음 에러 댓글
        if: steps.check_branch.outputs.exists != 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const branch = '${{ needs.check-command.outputs.custom_branch }}';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '❌ **빌드 검증 실패 - 커스텀 브랜치를 찾을 수 없습니다**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                `| **요청된 브랜치** | \`${branch}\` |`,
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '-1'
            });
            core.setFailed('브랜치 없음');

      - name: 코드 체크아웃
        if: steps.check_branch.outputs.exists == 'true'
        uses: actions/checkout@v5
        with:
          ref: ${{ steps.check_branch.outputs.ref }}

      - name: JDK 설정
        if: steps.check_branch.outputs.exists == 'true'
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}
          cache: 'gradle'

      - name: Gradle 권한 설정
        if: steps.check_branch.outputs.exists == 'true'
        run: chmod +x server/gradlew

      - name: application-prod.yml 생성
        if: steps.check_branch.outputs.exists == 'true'
        run: |
          mkdir -p $(dirname ${{ env.APPLICATION_YML_PATH }})
          cat << 'EOF' > ${{ env.APPLICATION_YML_PATH }}
          ${{ secrets.APPLICATION_PROD_YML }}
          EOF

      - name: 빌드 시작 시각 기록
        if: steps.check_branch.outputs.exists == 'true'
        id: timer
        run: echo "start=$(date +%s)" >> $GITHUB_OUTPUT

      - name: Gradle 빌드 검증
        if: steps.check_branch.outputs.exists == 'true'
        id: build
        working-directory: server
        run: |
          set -o pipefail
          ./gradlew clean build -x test -Dspring.profiles.active=prod 2>&1 | tee ${{ env.BUILD_LOG_PATH }}

      - name: 경과 시간
        if: steps.check_branch.outputs.exists == 'true' && always()
        id: elapsed
        run: |
          END=$(date +%s)
          START=${{ steps.timer.outputs.start }}
          DIFF=$((END - START))
          MIN=$((DIFF / 60))
          SEC=$((DIFF % 60))
          echo "elapsed=${MIN}분 ${SEC}초" >> $GITHUB_OUTPUT

      - name: 에러 로그 tail
        if: steps.check_branch.outputs.exists == 'true' && failure()
        id: tail_log
        run: |
          TAIL=$(tail -n 100 ${{ env.BUILD_LOG_PATH }} 2>/dev/null || echo "(로그 파일 없음)")
          {
            echo "log<<ENDOFLOG"
            echo "$TAIL"
            echo "ENDOFLOG"
          } >> $GITHUB_OUTPUT

      - name: 성공 댓글
        if: steps.check_branch.outputs.exists == 'true' && success()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.check_branch.outputs.ref }}';
            const elapsed = '${{ steps.elapsed.outputs.elapsed }}';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '✅ **빌드 검증 성공 (Custom Branch)**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | Spring 서버 (`server/`) |',
                `| **브랜치** | \`${ref}\` |`,
                `| **빌드 시간** | ${elapsed} |`,
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });

      - name: 실패 댓글
        if: steps.check_branch.outputs.exists == 'true' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.check_branch.outputs.ref }}';
            const log = `${{ steps.tail_log.outputs.log }}`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '❌ **빌드 검증 실패 (Custom Branch) - Gradle 빌드 에러**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | Spring 서버 (`server/`) |',
                `| **브랜치** | \`${ref}\` |`,
                '| **실패 단계** | `./gradlew clean build -x test` |',
                '',
                '<details>',
                '<summary>📋 에러 로그 (마지막 100줄)</summary>',
                '',
                '```',
                log,
                '```',
                '',
                '</details>',
                '',
                `🔗 [전체 워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '-1'
            });
```

- [ ] **Step 5: YAML 구문 검증**

```bash
python -c "import yaml; yaml.safe_load(open('D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml'))" && echo "YAML OK"
```

Expected: `YAML OK` 출력. 파싱 에러 시 해당 라인 수정.

- [ ] **Step 6: 커밋**

```bash
git add .github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Spring build-verify-* 3종 job 추가 (PR/Issue/Custom) #38"
```

---

## Task 6: Spring 파일 내부 사용자 안내 문구 교체

**Files:**
- Modify: `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (L591~593, L1252~1254, L1534~1535, L1944~1946, L599~601, L1260~1262, L678, L1336, L1437, L1549, L2113, L2221)

**Context:** 원본 파일 안에 사용자에게 안내하는 문구 중 `@suh-lab server build`라고 적힌 곳이 다수 있다. 이 문구들은 "Preview 배포를 다시 하려면..."이라는 의미이므로 **`deploy`로 바꿔야 한다**. 또한 `build` 전용 안내(신규 `build-verify-*`용)는 추가하지 않고, 기존 안내 표를 다음 형식으로 확장한다:

원본:
```
| `@suh-lab server build`  | 최신 커밋으로 재배포     |
| `@suh-lab server destroy` | Preview 환경 삭제       |
| `@suh-lab server status`  | 현재 상태 확인          |
```

변경 후:
```
| `@suh-lab server build`   | 배포 없이 빌드 검증만     |
| `@suh-lab server deploy`  | 최신 커밋으로 재배포     |
| `@suh-lab server destroy` | Preview 환경 삭제       |
| `@suh-lab server status`  | 현재 상태 확인          |
```

- [ ] **Step 1: 안내 표 블록 모두 찾기**

```bash
grep -n "@suh-lab server build.*최신 커밋으로 재배포" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

매칭되는 모든 라인을 확인.

- [ ] **Step 2: 각 매칭 지점에서 build→deploy 교체 + build 행 신설**

각 매칭 블록 (3행 짜리 표)을 위 변경 후 형태(4행)로 교체.

`replace_all`은 위험 — 각 블록마다 주변 컨텍스트가 조금씩 다르므로 Edit 도구로 각각 수정.

- [ ] **Step 3: "다시 배포하려면" 류 안내 문구 교체**

```bash
grep -n "다시 배포하려면.*build\|문제를 수정한 후 다시 시도.*build\|배포하려면.*server build" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 매칭에서 `@suh-lab server build` → `@suh-lab server deploy`로 교체 (이건 명확히 "배포" 맥락이므로 단순 치환 OK).

- [ ] **Step 4: Custom branch 안내 교체**

```bash
grep -n "server build \${branchName}\|server build \`\${branch" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 매칭에서 `server build ${branchName}` → `server deploy ${branchName}`으로 교체.

- [ ] **Step 5: 최종 검증 — 남은 `server build` 중 "재배포" 의미 잔존 여부 확인**

```bash
grep -n "server build" D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

매칭 결과 중:
- 파싱 블록(L140, `check-command`)의 정규식: **유지** (신규 `build` 명령어 파싱)
- `build-verify-*` job의 안내문: **유지** (신규 명령어 설명)
- 기존 3개 안내 표의 `server build` 행(행 자체가 신규 `build` 검증용으로 변경됨): **유지**
- "재배포" 의미로 남은 것: **0개여야 함**

만약 "재배포" 맥락인 `server build`가 남아있으면 모두 `server deploy`로 교체.

- [ ] **Step 6: YAML 구문 재검증**

```bash
python -c "import yaml; yaml.safe_load(open('D:/0-suh/project/passQL/.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml'))" && echo "YAML OK"
```

- [ ] **Step 7: 커밋**

```bash
git add .github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "docs(workflow): Spring PR-Preview 안내 문구 build/deploy 재정의 #38"
```

---

## Task 7: Python 템플릿 파일을 passQL로 복사

**Files:**
- Create: `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml`

- [ ] **Step 1: 원본 복사**

```bash
cp "D:/0-suh/project/suh-github-template/.github/workflows/project-types/python/synology/PROJECT-PYTHON-SYNOLOGY-PR-PREVIEW.yaml" "D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml"
```

- [ ] **Step 2: 라인 수 확인**

```bash
wc -l D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```
Expected: `2117` 줄

- [ ] **Step 3: 커밋**

```bash
git add .github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Python Synology PR-Preview 템플릿 원본 이식 (passQL) #38"
```

---

## Task 8: Python `env` 섹션을 passQL 값으로 치환

**Files:**
- Modify: `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (env 블록)

**Context:** passQL AI는 `ai/` 하위에 `pyproject.toml` + `src/main.py` 구조. Python 3.13. 엔트리포인트 `src.main:app`. Docker 미사용 (신규 `build-verify-*`만 해당, 기존 `deploy-preview-*`는 Docker 유지).

- [ ] **Step 1: `name` 필드 교체**

`name: PROJECT-PYTHON-SYNOLOGY-PR-PREVIEW` → `name: PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW`

- [ ] **Step 2: `env` 섹션 치환**

원본 `env:` 블록을 먼저 읽어 원본 키 이름 확인:

```bash
sed -n '28,80p' D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

원본 env 블록을 아래로 교체:

```yaml
env:
  PROJECT_NAME: passql-ai

  # Python 빌드 설정
  PYTHON_VERSION: '3.13'
  AI_WORKING_DIR: 'ai'
  AI_ENTRYPOINT_MODULE: 'src.main'
  AI_ENTRYPOINT_APP: 'app'

  # Docker 설정 (deploy-preview-* 전용, build-verify-* 는 Docker 미사용)
  DOCKERFILE_PATH: './ai/Dockerfile'
  INTERNAL_PORT: '8000'

  # 🗂️ 볼륨 마운트
  PROJECT_TARGET_DIR: ""
  PROJECT_MNT_DIR: ""

  # Traefik & Preview 도메인
  TRAEFIK_NETWORK: traefik-network
  PREVIEW_DOMAIN_SUFFIX: pr.suhsaechan.kr
  PREVIEW_PORT: '8078'

  SSH_PORT: '2022'
  ISSUE_HELPER_MARKER: 'Guide by SUH-LAB'

  HEALTH_CHECK_PATH: '/health'
  HEALTH_CHECK_LOG_PATTERN: 'Uvicorn running on'
  API_DOCS_PATH: '/docs'

  BUILD_LOG_PATH: '/tmp/build.log'
```

**주의**: 기존 passQL `PROJECT-PYTHON-AI-CI.yaml`에서 `/health` 경로를 쓰는지 확인 후 일치시킬 것:

```bash
grep -rn "HEALTH_CHECK_PATH\|/health\|/actuator" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-AI-CI.yaml D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-AI-CICD.yaml
```

경로가 다르면 위 값을 실제 경로로 수정.

- [ ] **Step 3: 원본의 Docker 빌드 step은 `deploy-preview-*` job에서만 사용되므로 그대로 유지**

`build-verify-*`는 Task 11에서 별도 추가. 이 Task에서는 기존 Docker 로직 건드리지 않음.

- [ ] **Step 4: 기존 Docker working-directory 경로 수정**

원본이 루트 기준으로 Docker 빌드하는 부분을 `ai/` 기준으로 수정:

```bash
grep -n "docker build\|DOCKERFILE_PATH" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 매칭에서 context가 `.` 이면 `./ai`로 수정, Dockerfile 경로는 `./ai/Dockerfile`로 수정.

- [ ] **Step 5: 커밋**

```bash
git add .github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Python PR-Preview env/경로를 passQL 구조로 맞춤 #38"
```

---

## Task 9: Python `check-command`에 `deploy` 분기 추가

**Files:**
- Modify: `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (check-command 블록)

**Context:** Task 3과 동일한 로직을 Python 파일에 적용.

- [ ] **Step 1: 파싱 블록 위치 확인**

```bash
grep -n "command=build\|command=destroy\|command=status" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

- [ ] **Step 2: `deploy` 분기 삽입**

Task 3 Step 2와 완전히 동일한 블록을 `build` 분기 바로 아래(`destroy` 분기 위)에 삽입:

```bash
          elif [[ "$COMMENT" =~ @suh-lab[[:space:]]+server[[:space:]]+deploy([[:space:]]+([^[:space:]]+))? ]]; then
            echo "command=deploy" >> $GITHUB_OUTPUT
            echo "is_valid=true" >> $GITHUB_OUTPUT
            if [[ -n "${BASH_REMATCH[2]}" ]]; then
              echo "custom_branch=${BASH_REMATCH[2]}" >> $GITHUB_OUTPUT
              echo "is_custom_branch=true" >> $GITHUB_OUTPUT
              echo "✅ 명령어 감지: deploy (브랜치: ${BASH_REMATCH[2]})"
            else
              echo "is_custom_branch=false" >> $GITHUB_OUTPUT
              echo "✅ 명령어 감지: deploy"
            fi
```

- [ ] **Step 3: 커밋**

```bash
git add .github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Python check-command에 deploy 분기 추가 #38"
```

---

## Task 10: Python `build-preview-*` → `deploy-preview-*` rename

**Files:**
- Modify: `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml`

**Context:** Task 4와 완전히 동일한 작업을 Python 파일에 적용.

- [ ] **Step 1: job 이름 3곳 rename**

```bash
grep -n "^  build-preview-" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

- `build-preview-pr:` → `deploy-preview-pr:`
- `build-preview-issue:` → `deploy-preview-issue:`
- `build-preview-custom-branch:` → `deploy-preview-custom-branch:`

- [ ] **Step 2: `name:` 필드 수정**

Task 4 Step 2와 동일하게 ` (deploy)` 접미사 추가.

- [ ] **Step 3: `if:` 조건 수정**

```bash
grep -n "command == 'build'" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

deploy-preview-* 3개 job 소속 `if:` 블록에서 `'build'` → `'deploy'`.

- [ ] **Step 4: `needs` 의존성 체인 수정**

```bash
grep -n "needs: .*build-preview" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

매칭 시 `deploy-preview-*`로 수정.

- [ ] **Step 5: 커밋**

```bash
git add .github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "refactor: Python build-preview-* 를 deploy-preview-* 로 rename #38"
```

---

## Task 11: Python 신규 `build-verify-*` 3종 job 추가 (pip + compileall + import)

**Files:**
- Modify: `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` (파일 끝)

**Context:** Docker 미사용. `pip install .` (pyproject.toml 기반) → `python -m compileall src` → `python -c "from src.main import app"` 3단계.

- [ ] **Step 1: `build-verify-pr` 추가**

파일 끝에 아래 블록 추가:

```yaml
  # -----------------------------------------------------------------
  # Job: AI 빌드 검증 (PR 댓글) - Docker 미사용, 경량 검증
  # -----------------------------------------------------------------
  build-verify-pr:
    name: AI 빌드 검증 (PR)
    needs: check-command
    if: |
      needs.check-command.outputs.is_valid == 'true' &&
      needs.check-command.outputs.command == 'build' &&
      needs.check-command.outputs.is_pr == 'true' &&
      needs.check-command.outputs.is_custom_branch != 'true'
    runs-on: ubuntu-latest
    steps:
      - name: PR 정보 가져오기
        id: pr
        uses: actions/github-script@v7
        with:
          script: |
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });
            core.setOutput('ref', pr.data.head.ref);
            core.setOutput('sha', pr.data.head.sha.substring(0, 7));

      - name: 코드 체크아웃
        uses: actions/checkout@v5
        with:
          ref: ${{ steps.pr.outputs.ref }}
          fetch-depth: 0

      - name: ai/ 변경 감지
        id: changes
        uses: actions/github-script@v7
        with:
          script: |
            const files = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              per_page: 300
            });
            const changed = files.data.some(f => f.filename.startsWith('ai/'));
            core.setOutput('ai_changed', changed.toString());

      - name: ai/ 미변경 시 스킵 안내
        if: steps.changes.outputs.ai_changed != 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                'ℹ️ **AI 빌드 검증 스킵**',
                '',
                'FastAPI 서버(`ai/`)에 변경사항이 없어 빌드 검증을 스킵했습니다.',
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });

      - name: Python 설정
        if: steps.changes.outputs.ai_changed == 'true'
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: .env 파일 생성
        if: steps.changes.outputs.ai_changed == 'true'
        run: |
          echo "${{ secrets.AI_ENV_FILE }}" > ai/.env

      - name: 빌드 시작 시각
        if: steps.changes.outputs.ai_changed == 'true'
        id: timer
        run: echo "start=$(date +%s)" >> $GITHUB_OUTPUT

      - name: 의존성 설치 (pip install .)
        if: steps.changes.outputs.ai_changed == 'true'
        working-directory: ai
        run: |
          set -o pipefail
          python -m pip install --upgrade pip 2>&1 | tee ${{ env.BUILD_LOG_PATH }}
          python -m pip install . 2>&1 | tee -a ${{ env.BUILD_LOG_PATH }}

      - name: 문법 검사 (compileall)
        if: steps.changes.outputs.ai_changed == 'true'
        working-directory: ai
        run: |
          set -o pipefail
          python -m compileall -q src 2>&1 | tee -a ${{ env.BUILD_LOG_PATH }}

      - name: FastAPI 앱 import 검증
        if: steps.changes.outputs.ai_changed == 'true'
        working-directory: ai
        run: |
          set -o pipefail
          python -c "from ${{ env.AI_ENTRYPOINT_MODULE }} import ${{ env.AI_ENTRYPOINT_APP }}; print('FastAPI app import OK')" 2>&1 | tee -a ${{ env.BUILD_LOG_PATH }}

      - name: 경과 시간
        if: steps.changes.outputs.ai_changed == 'true' && always()
        id: elapsed
        run: |
          END=$(date +%s)
          START=${{ steps.timer.outputs.start }}
          DIFF=$((END - START))
          MIN=$((DIFF / 60))
          SEC=$((DIFF % 60))
          echo "elapsed=${MIN}분 ${SEC}초" >> $GITHUB_OUTPUT

      - name: 에러 로그 tail
        if: steps.changes.outputs.ai_changed == 'true' && failure()
        id: tail_log
        run: |
          TAIL=$(tail -n 100 ${{ env.BUILD_LOG_PATH }} 2>/dev/null || echo "(로그 파일 없음)")
          {
            echo "log<<ENDOFLOG"
            echo "$TAIL"
            echo "ENDOFLOG"
          } >> $GITHUB_OUTPUT

      - name: 성공 댓글
        if: steps.changes.outputs.ai_changed == 'true' && success()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.pr.outputs.ref }}';
            const sha = '${{ steps.pr.outputs.sha }}';
            const elapsed = '${{ steps.elapsed.outputs.elapsed }}';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '✅ **AI 빌드 검증 성공**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | FastAPI 서버 (`ai/`) |',
                `| **브랜치** | \`${ref}\` |`,
                `| **커밋** | \`${sha}\` |`,
                `| **빌드 시간** | ${elapsed} |`,
                '| **검증 단계** | pip install → compileall → app import |',
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });

      - name: 실패 댓글
        if: steps.changes.outputs.ai_changed == 'true' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.pr.outputs.ref }}';
            const log = `${{ steps.tail_log.outputs.log }}`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '❌ **AI 빌드 검증 실패**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | FastAPI 서버 (`ai/`) |',
                `| **브랜치** | \`${ref}\` |`,
                '| **실패 단계** | pip install / compileall / app import 중 하나 |',
                '',
                '<details>',
                '<summary>📋 에러 로그 (마지막 100줄)</summary>',
                '',
                '```',
                log,
                '```',
                '',
                '</details>',
                '',
                `🔗 [전체 워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '-1'
            });
```

- [ ] **Step 2: `build-verify-issue` 추가**

Task 5 Step 3의 Spring Issue job을 참고하되 다음만 차이:
- `needs: [check-command, get-branch-from-issue]`
- `name:` → `AI 빌드 검증 (Issue)`
- 체크아웃 이후부터는 Step 1의 Python 빌드 step들로 교체 (Python 설정 → .env → pip install → compileall → import)
- 댓글 내용도 "FastAPI 서버 (`ai/`)"로

Spring Issue job과 구조가 동일하므로 복사 후 빌드 단계만 Python용으로 교체. **주의**: Issue job은 `actions/pulls.listFiles` 사용 불가(PR 아님)이므로 변경 감지 step은 생략한다. 이슈 트리거에서는 브랜치 전체를 그냥 검증한다.

전체 블록은 다음 구조:
```yaml
  build-verify-issue:
    name: AI 빌드 검증 (Issue)
    needs: [check-command, get-branch-from-issue]
    if: |
      needs.check-command.outputs.is_valid == 'true' &&
      needs.check-command.outputs.command == 'build' &&
      needs.check-command.outputs.is_pr == 'false' &&
      needs.check-command.outputs.is_custom_branch != 'true'
    runs-on: ubuntu-latest
    steps:
      - name: 브랜치 존재 여부 확인
        # ... (Task 5 Step 3의 check_branch 블록 그대로)
      - name: 브랜치 없음 에러 댓글
        # ... (동일, 대상만 "FastAPI 서버")
      - name: 코드 체크아웃
        if: steps.check_branch.outputs.exists == 'true'
        uses: actions/checkout@v5
        with:
          ref: ${{ steps.check_branch.outputs.ref }}
      - name: Python 설정
        if: steps.check_branch.outputs.exists == 'true'
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
      - name: .env 파일 생성
        if: steps.check_branch.outputs.exists == 'true'
        run: echo "${{ secrets.AI_ENV_FILE }}" > ai/.env
      - name: 빌드 시작 시각
        if: steps.check_branch.outputs.exists == 'true'
        id: timer
        run: echo "start=$(date +%s)" >> $GITHUB_OUTPUT
      - name: 의존성 설치
        if: steps.check_branch.outputs.exists == 'true'
        working-directory: ai
        run: |
          set -o pipefail
          python -m pip install --upgrade pip 2>&1 | tee ${{ env.BUILD_LOG_PATH }}
          python -m pip install . 2>&1 | tee -a ${{ env.BUILD_LOG_PATH }}
      - name: 문법 검사
        if: steps.check_branch.outputs.exists == 'true'
        working-directory: ai
        run: |
          set -o pipefail
          python -m compileall -q src 2>&1 | tee -a ${{ env.BUILD_LOG_PATH }}
      - name: 앱 import 검증
        if: steps.check_branch.outputs.exists == 'true'
        working-directory: ai
        run: |
          set -o pipefail
          python -c "from ${{ env.AI_ENTRYPOINT_MODULE }} import ${{ env.AI_ENTRYPOINT_APP }}; print('FastAPI app import OK')" 2>&1 | tee -a ${{ env.BUILD_LOG_PATH }}
      - name: 경과 시간
        if: steps.check_branch.outputs.exists == 'true' && always()
        id: elapsed
        run: |
          END=$(date +%s)
          START=${{ steps.timer.outputs.start }}
          DIFF=$((END - START))
          echo "elapsed=$((DIFF / 60))분 $((DIFF % 60))초" >> $GITHUB_OUTPUT
      - name: 에러 로그 tail
        if: steps.check_branch.outputs.exists == 'true' && failure()
        id: tail_log
        run: |
          TAIL=$(tail -n 100 ${{ env.BUILD_LOG_PATH }} 2>/dev/null || echo "(로그 파일 없음)")
          {
            echo "log<<ENDOFLOG"
            echo "$TAIL"
            echo "ENDOFLOG"
          } >> $GITHUB_OUTPUT
      - name: 성공 댓글
        if: steps.check_branch.outputs.exists == 'true' && success()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.check_branch.outputs.ref }}';
            const elapsed = '${{ steps.elapsed.outputs.elapsed }}';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '✅ **AI 빌드 검증 성공**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | FastAPI 서버 (`ai/`) |',
                `| **브랜치** | \`${ref}\` |`,
                `| **빌드 시간** | ${elapsed} |`,
                '',
                `🔗 [워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });
      - name: 실패 댓글
        if: steps.check_branch.outputs.exists == 'true' && failure()
        uses: actions/github-script@v7
        with:
          script: |
            const runUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const ref = '${{ steps.check_branch.outputs.ref }}';
            const log = `${{ steps.tail_log.outputs.log }}`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: [
                '❌ **AI 빌드 검증 실패**',
                '',
                '| 항목 | 값 |',
                '|------|-----|',
                '| **대상** | FastAPI 서버 (`ai/`) |',
                `| **브랜치** | \`${ref}\` |`,
                '',
                '<details>',
                '<summary>📋 에러 로그 (마지막 100줄)</summary>',
                '',
                '```',
                log,
                '```',
                '',
                '</details>',
                '',
                `🔗 [전체 워크플로우 로그](${runUrl})`
              ].join('\n')
            });
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '-1'
            });
```

**주의**: `needs.get-branch-from-issue.outputs.branch` 필드명은 원본 파일 내 `get-branch-from-issue` job의 실제 출력과 일치해야 함:
```bash
grep -n "get-branch-from-issue:" -A 15 D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml | head -30
```

- [ ] **Step 3: `build-verify-custom-branch` 추가**

Task 5 Step 4의 Spring Custom job을 베이스로 하되 빌드 단계만 Python으로 교체. 조건:
```yaml
    name: AI 빌드 검증 (Custom Branch)
    needs: check-command
    if: |
      needs.check-command.outputs.is_valid == 'true' &&
      needs.check-command.outputs.command == 'build' &&
      needs.check-command.outputs.is_custom_branch == 'true'
```

빌드 단계 구조는 Step 1과 동일 (Python 설정 → .env → pip install → compileall → import → 경과 → tail → 댓글).

브랜치 소스는 `${{ needs.check-command.outputs.custom_branch }}`.

- [ ] **Step 4: YAML 구문 검증**

```bash
python -c "import yaml; yaml.safe_load(open('D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml'))" && echo "YAML OK"
```

- [ ] **Step 5: 커밋**

```bash
git add .github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "feat: Python build-verify-* 3종 job 추가 (pip+compileall+import) #38"
```

---

## Task 12: Python 파일 내부 사용자 안내 문구 교체

**Files:**
- Modify: `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml`

**Context:** Task 6과 완전히 동일. Python 파일에도 `@suh-lab server build` 재배포 안내가 여러 곳에 있으므로 교체.

- [ ] **Step 1: 안내 표 확장**

```bash
grep -n "@suh-lab server build.*최신 커밋으로 재배포" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 블록에 Task 6과 동일한 4행 표로 확장.

- [ ] **Step 2: "다시 배포하려면" 치환**

```bash
grep -n "다시 배포하려면.*server build\|문제를 수정한 후 다시 시도.*server build\|배포하려면.*server build" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

각 `server build` → `server deploy`로 교체.

- [ ] **Step 3: Custom branch 안내 치환**

```bash
grep -n "server build \${branchName}\|server build \`\${branch" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

`server build ${branchName}` → `server deploy ${branchName}`.

- [ ] **Step 4: 최종 검증**

```bash
grep -n "server build" D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
```

"재배포" 맥락의 잔존 0개 확인.

- [ ] **Step 5: YAML 검증**

```bash
python -c "import yaml; yaml.safe_load(open('D:/0-suh/project/passQL/.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml'))" && echo "YAML OK"
```

- [ ] **Step 6: 커밋**

```bash
git add .github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml
git commit -m "docs(workflow): Python PR-Preview 안내 문구 build/deploy 재정의 #38"
```

---

## Task 13: 실제 PR 검증 시나리오

**Files:** 없음 (실제 GitHub에서 수동 검증)

**Context:** 워크플로우는 로컬에서 단위 테스트 불가. 실제 PR을 열고 각 명령어를 날려 동작 확인.

- [ ] **Step 1: 현재 브랜치를 GitHub로 push**

```bash
git push origin HEAD
```

- [ ] **Step 2: GitHub에서 PR 생성 (또는 기존 #38 이슈의 관련 PR 이용)**

브라우저에서 `passQL-Lab/passQL` 레포로 이동 → Compare & pull request → 생성.

- [ ] **Step 3: 시나리오 ① — `server build` (PR에서 빌드 검증)**

PR 페이지에 댓글 작성:
```
@suh-lab server build
```
확인:
- [ ] 👀 리액션 달림
- [ ] `build-verify-pr` job 실행
- [ ] `server/` 변경이 있으면 Gradle 빌드 실행
- [ ] 빌드 성공 시 ✅ 댓글 (브랜치/커밋/빌드 시간 포함 + 워크플로우 run URL)
- [ ] 실행된 워크플로우 run URL이 댓글에 정상 포함

- [ ] **Step 4: 시나리오 ② — `server deploy` (rename된 기존 build)**

PR 페이지에 댓글 작성:
```
@suh-lab server deploy
```
확인:
- [ ] 기존 `deploy-preview-pr` job 실행
- [ ] 진행 상황 댓글이 생성되고 실제 Synology 배포까지 수행
- [ ] Preview URL이 최종 댓글에 표시

- [ ] **Step 5: 시나리오 ③ — `server status`**

```
@suh-lab server status
```
확인:
- [ ] 기존 `check-status` job 실행, 현재 Preview 상태 표시

- [ ] **Step 6: 시나리오 ④ — 브랜치 없음 에러 (custom-branch)**

```
@suh-lab server build nonexistent-branch-xyz
```
확인:
- [ ] `build-verify-custom-branch` job 실행
- [ ] 브랜치 없음 에러 댓글 표시 (`<details>` 없이 안내문 + 워크플로우 run URL)
- [ ] ❌ 리액션

- [ ] **Step 7: 시나리오 ⑤ — 고의 빌드 에러**

`server/` 쪽 임의의 Java 파일에 문법 에러 삽입 후 push:
```java
public class Broken { this is broken }
```
PR에 댓글:
```
@suh-lab server build
```
확인:
- [ ] Gradle 빌드 실패
- [ ] 실패 댓글에 `<details>` 접기가 있고, 펼쳤을 때 마지막 100줄 에러 로그 표시
- [ ] 워크플로우 run URL 포함
- [ ] ❌ 리액션

확인 후 문법 에러 되돌리기 (revert).

- [ ] **Step 8: 시나리오 ⑥ — paths 미변경 스킵**

`client/` 쪽만 변경한 커밋 push → PR에 `@suh-lab server build` 댓글
확인:
- [ ] `build-verify-pr` 가 "ℹ️ 빌드 검증 스킵" 정보성 댓글 출력
- [ ] ✅ 리액션 (에러 아님)

- [ ] **Step 9: 시나리오 ⑦ — `server destroy`**

```
@suh-lab server destroy
```
확인:
- [ ] `destroy-preview` 정상 작동, Preview 환경 삭제

- [ ] **Step 10: AI도 동일 시나리오 반복**

`ai/` 디렉토리 임의 변경 후 시나리오 ①, ②, ⑤(import error 삽입으로), ⑥(client 쪽만 바꾸기) 반복.

- [ ] **Step 11: 검증 결과를 PR 코멘트로 정리**

모든 시나리오 통과 후 PR에 수기로 다음 형식 댓글 추가:
```
## server build/deploy 워크플로우 검증 결과

- [x] Spring: server build (PR)
- [x] Spring: server deploy (PR)
- [x] Spring: server build (브랜치 없음 에러)
- [x] Spring: server build (빌드 에러 + <details> 로그)
- [x] Spring: server build (paths 미변경 스킵)
- [x] Spring: server destroy
- [x] AI: server build (PR)
- [x] AI: server deploy (PR)
- [x] AI: server build (import 에러 + <details> 로그)
- [x] AI: server build (paths 미변경 스킵)
- [x] AI: server destroy
```

통과 못 한 케이스는 해당 Task로 돌아가 수정 후 재검증.

- [ ] **Step 12: 마지막 커밋**

검증 과정에서 수정사항이 있었다면 커밋. 없었으면 스킵.

---

## 완료 기준

- 13개 Task 모두 체크박스 완료
- `.github/workflows/PROJECT-SPRING-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` 존재 및 YAML 파싱 성공
- `.github/workflows/PROJECT-PYTHON-SYNOLOGY-PASSQL-PR-PREVIEW.yaml` 존재 및 YAML 파싱 성공
- 두 파일 모두 `check-command`에 `build`/`deploy`/`destroy`/`status` 4개 분기 존재
- 두 파일 모두 `deploy-preview-*` 3종, `build-verify-*` 3종, `destroy-preview*`, `check-status*` job 존재
- 실제 PR에서 Task 13의 12개 시나리오 모두 통과

---

## 주요 결정사항 요약

| 결정 | 근거 |
|---|---|
| `build` → `deploy` 완전 rename (하위 호환 X) | 사용자 요청, 네이밍 명확화 |
| AI는 Docker 미사용, 경량 검증 (pip + compileall + import) | 사용자 요청, 속도 3~5배 빠름 |
| paths 변경 없으면 스킵 (Q3-b) | 불필요한 빌드 리소스 절약 |
| 리액션만 (Q3-c, 👀 → ✅/❌) | 댓글 덜 시끄럽게 |
| 에러 로그 tail 100줄 + `<details>` | Q3-a 결정, GitHub 코멘트 길이 제한 회피 |
| custom-branch 포함 3종 모두 구현 | 사용자 기존 기능 유지 확인 |
| 템플릿 파일을 그대로 복사 후 수정 (Task 1, 7) | 사용자 "템플릿 그대로" 요청 |
| 기존 passQL CI/CDICD 4개는 그대로 유지 | 트리거 조건 중복 없음, 안전 |
