# GitHub Actions CI/CD paths 필터 동작 방식

## 개요

`deploy` 브랜치에 push 시 Spring/AI CI/CD 워크플로우가 실행되지 않는 경우가 있다. 이는 버그가 아니라 `paths` 필터에 의한 **의도된 동작**이다. 이 문서는 해당 동작 방식을 설명한다.

## 워크플로우 트리거 조건

| 워크플로우 | 브랜치 | 경로 조건 |
|---|---|---|
| `PROJECT-SPRING-SYNOLOGY-PASSQL-CICD` | `deploy` | `server/**` |
| `PROJECT-PYTHON-AI-CICD` | `deploy` | `ai/**` |

두 워크플로우 모두 `deploy` 브랜치 push **AND** 해당 경로 파일 변경이 **동시에 충족**될 때만 실행된다.

## 동작 예시

| push 내용 | Spring CI/CD | AI CI/CD |
|---|---|---|
| `server/` 하위 파일 변경 | ✅ 실행 | ❌ 미실행 |
| `ai/` 하위 파일 변경 | ❌ 미실행 | ✅ 실행 |
| README, 문서 등 변경 | ❌ 미실행 | ❌ 미실행 |
| `server/` + `ai/` 동시 변경 | ✅ 실행 | ✅ 실행 |

## 수동 실행

코드 변경 없이 재배포가 필요한 경우 `workflow_dispatch`로 수동 실행 가능하다.

> GitHub Actions 탭 → 워크플로우 선택 → **Run workflow**
