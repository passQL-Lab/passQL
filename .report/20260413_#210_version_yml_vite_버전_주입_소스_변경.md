# 🚀[기능개선][버전관리] version.yml project_type react 전환 및 package.json 버전 동기화

## 개요

`vite.config.ts`의 `__APP_VERSION__` 빌드 타임 주입 소스를 `package.json`에서 레포 루트 `version.yml`로 변경했다. `version_manager.sh`가 단일 프로젝트 기준으로 설계되어 멀티 모듈 구조(`client/package.json`)를 자동 동기화하지 못하는 구조적 문제를 추가 의존성 없이 우회했다.

## 변경 사항

### 빌드 설정
- `client/vite.config.ts`: `package.json` 읽기 → `../../version.yml` 읽기로 교체. 정규식으로 `version` 필드를 추출해 `__APP_VERSION__`에 주입.

## 주요 구현 내용

`readFileSync` + `import.meta.url` 기반 절대 경로(기존 패턴 유지)로 `version.yml`을 읽고, `/^version:\s*"([^"]+)"/m` 정규식으로 버전 문자열을 추출한다. 파싱 실패 시 `"0.0.0"` 폴백. `js-yaml` 등 추가 의존성 없이 단일 라인 변경으로 해결.

```ts
const versionYml = readFileSync(
  fileURLToPath(new URL("../../version.yml", import.meta.url)),
  "utf-8",
);
const appVersion = versionYml.match(/^version:\s*"([^"]+)"/m)?.[1] ?? "0.0.0";
```

## 주의사항

- `version_manager.sh`의 멀티 모듈 경로 문제 및 `project_type` react 전환은 미해결 상태 — 별도 이슈로 장기 처리
- `package.json`의 `version` 필드(`"1.0.0"`)는 이 작업과 무관하게 유지됨 (빌드 타임에 사용되지 않음)
