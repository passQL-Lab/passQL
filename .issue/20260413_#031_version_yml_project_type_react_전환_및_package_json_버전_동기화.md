# ⚙️[기능개선][DevOps] version.yml project_type react 전환 및 package.json 버전 동기화

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- `version.yml`의 `project_type`이 `"basic"`으로 설정되어 있어 GitHub Actions 버전 관리 워크플로우가 `package.json`을 동기화하지 않음
- `package.json`의 `version`이 `"1.0.0"`으로 고정되어 있어 `__APP_VERSION__` Vite 빌드 타임 주입값이 실제 릴리즈 버전(현재 `0.0.115`)과 불일치
- 설정 화면에 표시되는 앱 버전이 잘못된 값(`1.0.0`)을 보여주고 있음
- **구조적 문제**: `version_manager.sh`가 단일 프로젝트 기준으로 설계되어 있어 `react` 타입 시 `VERSION_FILE="package.json"`을 레포 루트 기준으로 찾음. 이 프로젝트는 `client/package.json`에 있어 워크플로우가 루트에서 실행될 경우 파일을 찾지 못하고 동기화를 건너뜀

🛠️해결 방안 / 제안 기능
---

- `package.json`의 `version`을 현재 `version.yml` 버전(`0.0.115`)보다 낮은 값으로 먼저 수정 (예: `"0.0.1"`)
  - `version_manager.sh`의 `get_higher_version` 로직이 더 높은 버전을 우선하므로, `package.json`이 `1.0.0`인 상태에서 `react` 타입으로 전환하면 `version.yml`이 `1.0.0`으로 덮어써지는 충돌 발생
  - 반드시 `package.json` 버전을 낮춘 뒤 `project_type` 변경
- `version.yml`의 `project_type`을 `"basic"` → `"react"`로 변경
- **멀티 모듈 경로 문제 해결 필요** — 아래 두 가지 방법 중 하나 선택:
  - **방법 A** `version_manager.sh`에 커스텀 `version_file_path` 옵션 추가하여 `client/package.json` 경로를 명시적으로 지정
  - **방법 B** `vite.config.ts`에서 빌드 타임에 `version.yml`을 직접 파싱해 `__APP_VERSION__`을 주입 — 스크립트 수정 없이 해결 가능하며 멀티 모듈 구조에 더 안전함 (권장)

⚙️작업 내용
---

- `client/package.json`: `"version"` 필드를 `"0.0.1"`로 수정 (충돌 방지 선행 작업)
- `version.yml`: `project_type`을 `"react"`로 변경
- 방법 A 또는 방법 B 중 선택하여 멀티 모듈 경로 문제 해결
- 변경 후 워크플로우 정상 동작 확인 (Actions 로그 검증)

🙋‍♂️담당자
---

- 프론트엔드: 
