# passQL — 모노레포 마스터 인덱스 (AI 진입점)

passQL은 **4개 스택을 한 레포에서 관리하는 모노레포**다. 작업 대상 스택의
`CLAUDE.md`를 먼저 읽고 그 규칙을 따른다. 이 문서는 전체 네비게이션 + 공통 규칙.

## 스택 네비게이션

| 스택 | 폴더 | 진입점 | 역할 |
|------|------|--------|------|
| Frontend | `client/` | [client/CLAUDE.md](client/CLAUDE.md) | React + Vite + TS 웹 |
| Backend | `server/` | [server/CLAUDE.md](server/CLAUDE.md) | Spring 멀티모듈 (API·관리자) |
| AI Server | `ai/` | [ai/CLAUDE.md](ai/CLAUDE.md) | Python FastAPI (LLM·벡터검색) |
| App | `app/` | [app/CLAUDE.md](app/CLAUDE.md) | Flutter 모바일 앱 |

**통신 구조**: client/app ──(/api)──> server(Spring) ──(x-api-key)──> ai(FastAPI).
프론트(client/app)는 **server하고만 통신**한다. ai 서버 직접 호출 금지.

## 문서 위치 (예측 가능한 경로)

| 종류 | 위치 |
|------|------|
| 제품 기획 (PRD·ROADMAP·SCREEN-SPEC) | `docs/product/` |
| 작업 리포트·이슈 산출물 | `docs/suh-template/{report,issue}/` |
| 스킬 산출물 (계획·스펙) | `docs/superpowers/{plans,specs}/` |
| 분석 리포트 | `docs/reports/` |

스택 전용 문서는 각 스택 폴더 내부(`{stack}/docs/`, `{stack}/.claude/rules/`)에 둔다.

## 버전·배포 (CI 자동 관리 — 수동 수정 금지)

- `version.yml` = 단일 버전 기준. `CHANGELOG.json/md`는 워크플로우가 자동 갱신.
- `.github/workflows/` = CI/CD. main push → deploy PR → automerge → 시놀로지 배포.

## 공통 금지 규칙 (모든 스택)

- **`git push`는 사용자 명시 요청 시에만** — 임의 push 금지.
- **민감 정보 커밋 절대 금지** — `.env*`, PAT/토큰, API 키, firebase-service-account,
  keystore 등. push 전 시크릿 스캔 필수. (`.gitignore` 신뢰하되 staged 재확인)
- **커밋 메시지 Co-Authored-By 태그 금지.**
- **파일 삭제 시 사용자 허락.**
- **답변은 항상 한국어로** (코드/커맨드 제외).
- **모르면 모른다고 말하기** — 추측 금지.
- **코드 주석 필수** — WHY 중심의 간결한 한국어 주석.

---

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex,
/cso, /autoplan, /pair-agent, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn.
