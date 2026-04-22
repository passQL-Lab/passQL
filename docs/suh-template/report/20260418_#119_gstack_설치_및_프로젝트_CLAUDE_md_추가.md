# gstack 설치 및 프로젝트 CLAUDE.md 추가

## 개요

로컬 홈 디렉토리에 이미 존재하던 gstack(v0.18.3.0) 설치물에 대해 `setup` 스크립트를 재실행하여 Claude Code 스킬 링크를 최신 상태로 맞추고, passQL 레포 루트에 `CLAUDE.md`를 신규 작성해 프로젝트 진입 시 gstack 슬래시 커맨드 규약이 적용되도록 했다. passQL 레포 내부 코드는 수정하지 않았다.

## 변경 사항

### 프로젝트 파일 (passQL 레포)

- `CLAUDE.md` **신규 생성**: `## gstack` 섹션 1개 작성. 내용은 다음과 같다.
  - 웹 브라우징 시 gstack의 `/browse` 스킬만 사용하고 `mcp__claude-in-chrome__*` 도구는 사용 금지
  - 사용 가능한 gstack 슬래시 커맨드 32종을 한 줄로 나열 (`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/open-gstack-browser`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/pair-agent`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`)
- `.issue/20260418_#119_gstack_설치_및_프로젝트_CLAUDE_md_추가.md` **신규 생성**: 이번 작업을 추적하기 위한 기능 추가 이슈 문서 (템플릿: feature_request, 라벨: `작업전`)

### 레포 밖 작업 (기록 목적)

- `~/.claude/skills/gstack`에서 `./setup` 실행 → Claude Code 호스트용 스킬 링크 재생성 및 `/browse` 바이너리 빌드 확인 (`~/.claude/skills/gstack/browse/dist/browse`)
  - 이 단계는 홈 디렉토리 전역 환경에만 영향을 주며 passQL 레포에는 파일이 추가되지 않음

## 주요 구현 내용

- **사전 상태 점검**
  - `~/.claude/skills/gstack` 존재 및 `VERSION`이 `0.18.3.0`임을 확인
  - 요구사항 점검: Bun 1.3.12, Git 2.39.5
  - `~/.gstack` 전역 설정 디렉토리(`config.yaml`, `projects`) 존재 확인
- **gstack 셋업 재실행**
  - `cd ~/.claude/skills/gstack && ./setup` 실행
  - 출력 로그에서 `gstack ready (claude)` 및 `linked skills: ...` 확인으로 정상 링크 검증
  - codex 호스트용 `.agents/skills/gstack-*/SKILL.md` 토큰 버짓 리포트가 함께 생성되었으나 이는 gstack 내부 산출물이며 passQL 레포 변경 아님
- **프로젝트 진입점 추가**
  - passQL 루트에 `CLAUDE.md`가 없던 상태 → README에서 권장하는 최소 형식의 `## gstack` 섹션만 작성
  - 별도 팀 모드(`./setup --team`, `gstack-team-init`)나 `.claude/` 디렉토리 부트스트랩은 수행하지 않음 (추후 결정 사항으로 남김)
- **작업 이력화**
  - `.issue/` 하위에 기존 번호 패턴(`YYYYMMDD_#NNN_제목.md`)을 따라 `#119` 번호로 이슈 문서 생성
  - feature_request 템플릿 구조를 그대로 따름 (📝현재 문제점 / 🛠️해결 방안 / ⚙️작업 내용 / 📸참고 자료 / ✅예상 동작 / ⚙️환경 정보 / 🙋‍♂️담당자)

## 주의사항

- **미커밋 상태**: `CLAUDE.md`와 `.issue/...#119...md` 두 파일 모두 `Untracked` 상태이며 git 커밋은 아직 수행하지 않았다. 팀 공유하려면 사용자가 원하는 커밋 메시지 형식으로 별도 커밋 필요.
- **코드/설정/마이그레이션 영향 없음**: 서버(Spring), 프론트(React), Flyway, CI 설정에는 어떠한 변경도 가하지 않았다.
- **.gitignore 미조정**: `.issue/`, `.report/`는 기존 레포 관행대로 커밋 대상이므로 추가 조치 불필요. `CLAUDE.md`는 팀 공유용이므로 커밋 권장.
- **팀 모드 미적용**: 현재는 개인 환경에만 gstack이 연결된 상태다. 팀원 전원이 동일 환경을 쓰려면 향후 `./setup --team` + 레포 부트스트랩 단계를 별도 이슈로 처리해야 한다.
- **전역 설치물 의존**: `CLAUDE.md`는 gstack이 각자의 `~/.claude/skills/gstack`에 설치되어 있다는 전제를 따른다. 미설치 팀원은 별도로 설치해야 커맨드가 동작한다.
