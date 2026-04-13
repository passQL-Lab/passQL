# 앱 버전 주입 소스 변경 — package.json → version.yml

## 배경 및 목적

`vite.config.ts`가 `package.json`의 `version` 필드를 읽어 `__APP_VERSION__` 빌드 타임 상수를 주입하고 있다.
그러나 `package.json`의 버전은 `"1.0.0"`으로 고정되어 있고, 실제 릴리즈 버전은 `version.yml`이 관리한다.
`version_manager.sh`가 단일 프로젝트 기준으로 설계되어 멀티 모듈 구조(`client/package.json`)를 자동 동기화하지 못하는 구조적 문제가 있어, 근본 해결보다 단순한 방법을 선택한다.

## 해결 방법

`vite.config.ts`에서 `../version.yml`을 직접 읽어 정규식으로 버전을 추출한다.
`js-yaml` 같은 추가 의존성 없이, `version: "x.y.z"` 패턴이 단순하므로 정규식으로 충분하다.

## 변경 내용

**변경 파일:** `client/vite.config.ts` 1개

```ts
// 변경 전
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8")
) as { version: string };
define: { __APP_VERSION__: JSON.stringify(pkg.version) }

// 변경 후
const versionYml = readFileSync(
  fileURLToPath(new URL("../../version.yml", import.meta.url)), "utf-8"
);
const appVersion = versionYml.match(/^version:\s*"([^"]+)"/m)?.[1] ?? "0.0.0";
define: { __APP_VERSION__: JSON.stringify(appVersion) }
```

- `../../version.yml`: `client/vite.config.ts` 기준 두 단계 위 → 레포 루트 `version.yml`
- 정규식 `^version:\s*"([^"]+)"`m: 멀티라인 모드로 `version: "0.0.115"` 라인 매칭
- 파싱 실패 시 `"0.0.0"` 폴백

## 범위 외

- `version_manager.sh` 경로 오버라이드 및 `project_type` react 전환 — 별도 이슈로 장기 처리
- `package.json`의 `version` 필드는 이 작업과 무관하게 유지
