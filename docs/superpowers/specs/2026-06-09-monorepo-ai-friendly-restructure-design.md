# 모노레포 AI-친화 구조 개편 설계

**작성일:** 2026-06-09
**범위:** 구조 개편 + 문서 골격 재정비 (문서 상세 내용 채움은 다음 단계)
**원칙:** 코드는 건드리지 않는다. 구조·문서·진입점만 개편한다.

---

## 1. 배경 / 문제

passQL은 client(React) / server(Spring) / ai(Python) / app(Flutter) 4개 스택을
한 레포에 담은 모노레포다. 그런데:

- 코드는 오늘도 바뀌는데(client·server·app 2026-06-09 활동) 문서는 4월에 멈춤
  - PRD/ROADMAP: 2026-04-13, SCREEN-SPEC: 2026-04-07, README: 2026-04-27
- app(Flutter)이 방금 통째로 합쳐졌는데 어떤 루트 문서도 app을 모름
- 루트 `CLAUDE.md`가 7줄짜리라 네비게이션 역할을 못 함
- 4스택 중 `ai/`에만 CLAUDE.md가 없음
- API 스펙 사본(be-api-docs.json 등)이 중복 존재 — server 코드가 같은 레포에 있어 불필요
- IDE/임시 파일(`.run/`, `.template_download_temp`)이 git 추적되어 AI 탐색 시 노이즈

## 2. 설계 목표

**"AI가 진입점에서 시작해 예측 가능한 경로로 모든 걸 찾는 구조"**

사람이 보기 예쁜 구조가 아니라, AI 에이전트가 이 레포에 들어왔을 때 헤매지 않고
바로 일할 수 있는 구조가 목표다.

## 3. 설계 원칙

### 원칙 1 — 루트 = 네비게이션 허브
- **루트 `CLAUDE.md`** = AI용 마스터 인덱스. "이 레포는 4스택 모노레포. 각 스택의
  진입점은 `{stack}/CLAUDE.md`. 공통 문서는 `docs/`." + 4스택 1줄 요약 + 공통 규칙.
- **루트 `README.md`** = 사람용 홍보/제품 소개. 모노레포 구조도 명시.
- 역할 분리: README는 사람, CLAUDE.md는 AI.

### 원칙 2 — 각 스택은 자기 CLAUDE.md가 진입점
- Claude Code는 작업 폴더의 CLAUDE.md + 루트 CLAUDE.md를 자동으로 읽는다.
  따라서 루트 = 공통, 각 스택 = 전용 규칙으로 분리한다.
- `ai/CLAUDE.md` 신규 작성 (4스택 중 유일하게 없음).
- client/server/app CLAUDE.md는 골격 검토(현재 구조와 어긋난 부분만).

### 원칙 3 — docs/ 는 역할별 폴더로 (평평 → 분류)
```
docs/
├── product/        PRD, ROADMAP, SCREEN-SPEC   (제품 기획 — 스택 무관 공통)
├── suh-template/   issue/ report/               (이미 정리됨, 유지)
└── superpowers/    plans/ specs/                 (스킬 산출물, 유지)
```
AI가 "기획 문서? → `docs/product/`"처럼 타입으로 위치를 예측한다.

### 원칙 4 — 노이즈 제거
AI가 헷갈릴 중복/불필요/추적노이즈를 제거한다.

## 4. 구체적 작업 (단계별 커밋)

### 단계 A — 노이즈/중복 삭제
| 대상 | 처리 | 이유 |
|------|------|------|
| `client/docs/be-api-docs.json` | 삭제 | server 코드가 같은 레포 → 스펙 사본 불필요 |
| `client/docs/ai-api-docs.json` | 삭제 | 〃 |
| `app/docs/be-api-docs.json` | 삭제 | 〃 |
| `app/docs/PRD.md` | 삭제 | 루트 PRD(더 최신·상위호환)와 중복 |
| `github-issues/` | 삭제 | CI 미참조 산출물 (git 히스토리엔 남음) |

### 단계 B — gitignore 정리 (추적 노이즈 제거)
| 대상 | 처리 |
|------|------|
| `.run/` | `.gitignore` 추가 + `git rm --cached` |
| `.template_download_temp` | `.gitignore` 추가 + `git rm --cached` |

### 단계 C — docs/ 분류
- `docs/PASSQL-PRD.md`, `docs/PASSQL-ROADMAP.md`, `docs/PASSQL-SCREEN-SPEC.md`
  → `docs/product/` 하위로 이동
- `docs/bug-analysis-*.md` → `docs/reports/` 또는 적절 위치 (검토 후 결정)
- `docs/suh-template/`, `docs/superpowers/` → 유지 (이미 컨벤션 일치)

### 단계 D — 죽은 참조 수정
- `client/.claude/rules/api-guide.md`: "스키마 원본: docs/be-api-docs.json" →
  "server 코드 / 런타임 Swagger(`/docs/swagger-ui`)" 기준으로 변경
- `app/.claude/rules/api-guide.md`: be-api-docs.json 언급 문구 정리

### 단계 E — CLAUDE.md 골격 정비
- 루트 `CLAUDE.md`: 7줄 → 4스택 네비게이션 + 공통 규칙 골격으로 확장
- `ai/CLAUDE.md`: 신규 작성 (Python FastAPI 스택 구조 + 규칙 골격)
- client/server/app CLAUDE.md: 현재 구조와 어긋난 부분만 골격 검토

### 단계 F — 루트 문서 골격 갱신
- `README.md`: 모노레포 4스택 구조 섹션 추가 (홍보 톤 유지)
- `docs/product/` 각 문서: 목차/섹션 골격을 현재 스택(4개) 기준으로 맞춤.
  **상세 내용 채움은 이번 범위 밖** — 골격만.

## 5. 건드리지 않는 것 (범위 밖)

- 각 스택 **내부 코드** (client/src, server/PQL-*, ai/src, app/lib)
- `version.yml`, `CHANGELOG.json`, `CHANGELOG.md` — CI 자동 관리
- `.github/workflows/` — CI/CD (사용자가 별도로 작업 예정)
- `docs/suh-template/`, `docs/superpowers/` 내용 — 이미 정리됨
- **문서 상세 내용** — 골격만 맞추고 내용 채움은 다음 단계

## 6. 결과 구조

```
passQL/
├── CLAUDE.md       ← AI 마스터 인덱스 (4스택 네비게이션 + 공통 규칙)
├── README.md       ← 사람용 제품 홍보 (+ 모노레포 구조 명시)
├── client/  CLAUDE.md  React
├── server/  CLAUDE.md  Spring (멀티모듈)
├── ai/      CLAUDE.md  Python FastAPI  ← 신규
├── app/     CLAUDE.md  Flutter
├── docs/
│   ├── product/      PRD · ROADMAP · SCREEN-SPEC
│   ├── suh-template/ issue/ · report/
│   └── superpowers/  plans/ · specs/
├── version.yml  CHANGELOG.*  (CI 자동관리)
└── .github/workflows/  (별도 작업 예정)
```

## 7. 안전장치

- 이동/삭제/문서작성을 **의미 단위로 커밋 분리** (단계 A~F)
- 커밋 메시지는 진행 시 사용자에게 받음
- 삭제는 git 히스토리에 보존되어 복구 가능
