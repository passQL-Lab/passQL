# ⚙️[기능추가][DevEnv] gstack 설치 및 프로젝트 CLAUDE.md 추가

**라벨**: `작업전`
**담당자**: Cassiiopeia

---

📝현재 문제점
---

- passQL 프로젝트에서 Claude Code 기반 AI 워크플로우(YC 스타일 기획, 코드 리뷰, QA, 배포, 보안 감사 등)를 체계적으로 적용할 수 있는 공용 슬래시 커맨드 세트가 없었음
- 팀원마다 AI 협업 프로세스(기획→설계→리뷰→QA→릴리즈)가 제각각이라 일관된 품질 게이트를 강제하기 어려움
- Claude Code 세션에서 `/review`, `/qa`, `/ship`, `/cso` 등 표준화된 스킬을 호출할 수 있는 환경 구성(전역 설치 + 프로젝트 진입점)이 부재

🛠️해결 방안 / 제안 기능
---

- Garry Tan(YC) 공개 오픈소스인 **gstack v0.18.3.0**을 `~/.claude/skills/gstack` 경로에 전역 설치
- gstack `setup` 스크립트를 실행하여 Claude Code 호스트용 37개 슬래시 커맨드(스킬)를 자동 등록
  - 대표 스킬: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/review`, `/qa`, `/ship`, `/cso`, `/autoplan`, `/investigate`, `/document-release`, `/retro` 등
  - `/browse` 바이너리 빌드 완료 (`~/.claude/skills/gstack/browse/dist/browse`)
- passQL 프로젝트 루트에 **`CLAUDE.md` 신규 생성**하여 gstack 섹션 명시
  - 프로젝트 진입 시 Claude Code가 gstack 스킬 목록을 인식하도록 안내
  - 웹 브라우징은 `/browse` 스킬을 사용하고 `mcp__claude-in-chrome__*` 도구는 사용하지 않도록 규약화

⚙️작업 내용
---

- [x] 사전 요구사항 점검: Git 2.39.5, Bun 1.3.12 확인
- [x] `~/.claude/skills/gstack` 설치 상태 확인 (기존 클론 존재 확인)
- [x] `./setup` 실행하여 스킬 링크 및 토큰 버짓 리포트 생성
- [x] passQL 루트에 `CLAUDE.md` 생성 및 gstack 섹션 작성
- [ ] 팀원 공유: `CLAUDE.md` git 커밋 및 푸시 여부 결정
- [ ] 팀 모드 전환 검토: `./setup --team` + `gstack-team-init` 적용 시 레포에 `.claude/` 부트스트랩하여 팀원 자동 업데이트 파이프라인 구성

📸참고 자료
---

- gstack 공식 저장소: https://github.com/garrytan/gstack
- 설치 버전: `0.18.3.0`
- 설치 경로: `~/.claude/skills/gstack`
- 프로젝트 설정 파일: `passQL/CLAUDE.md`
- 주요 사용 시나리오
  - 기획 단계: `/office-hours` → `/plan-ceo-review` → `/plan-eng-review`
  - 구현 후: `/review` → `/qa <staging-url>` → `/ship`
  - 보안 검토: `/cso` (OWASP Top 10 + STRIDE)
  - 디버깅: `/investigate` (Iron Law: 근본 원인 없이는 수정 금지)

✅예상 동작
---

- Claude Code 재시작 시 passQL 프로젝트에서 gstack 슬래시 커맨드 전체가 자동 인식됨
- `/browse`로 실제 크로미움 브라우저 제어 가능 (`~100ms`/커맨드)
- `CLAUDE.md`가 루트에 존재하여 팀원이 레포 클론 후 동일한 AI 워크플로우 규약을 공유
- 개별 커맨드 업데이트는 `/gstack-upgrade`로 수행

⚙️환경 정보
---

- **OS**: macOS (Darwin 24.1.0)
- **Shell**: zsh
- **Claude Code**: 설치 완료
- **Bun**: v1.3.12 (`/Users/suhsaechan/.bun/bin/bun`)
- **Git**: v2.39.5 (Apple Git-154)
- **gstack**: v0.18.3.0 (host: claude)

🙋‍♂️담당자
---

- 백엔드: Cassiiopeia
- 프론트엔드: Cassiiopeia
- 디자인: -
