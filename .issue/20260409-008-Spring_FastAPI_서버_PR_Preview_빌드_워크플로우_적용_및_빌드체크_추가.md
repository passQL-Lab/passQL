# ⚙️[기능추가][CICD] Spring/FastAPI 서버 PR Preview 빌드 워크플로우 적용 및 빌드체크 전용 명령어 추가

**라벨**: `작업전`
**담당자**:

---

📝현재 문제점
---

- 현재 passQL 레포에는 Spring(AI가 아닌 서버) / FastAPI(AI 서버)에 대한 **테스트 서버 배포 워크플로우가 없음**.
- `suh-github-template`에는 이미 검증된 PR Preview / Synology 배포 워크플로우가 존재하지만, passQL에는 아직 적용되지 않음.
  - `PROJECT-SPRING-SYNOLOGY-PR-PREVIEW.yaml`
  - `PROJECT-SPRING-SYNOLOGY-SIMPLE-CICD.yaml`
  - `PROJECT-PYTHON-SYNOLOGY-PR-PREVIEW.yaml`
  - `PROJECT-PYTHON-SYNOLOGY-CICD.yaml`
- PR 단위로 배포까지 가는 `server build`(= PR Preview 배포) 외에, **"진짜 배포는 하지 않고 빌드 가능 여부만 검증"** 하는 경량 명령어가 필요함.
  - 현재는 빌드만 확인하고 싶을 때도 Preview 배포 전체 플로우를 태워야 해서 불필요한 리소스/시간 소모.

🛠️해결 방안 / 제안 기능
---

### 1. suh-github-template의 서버 빌드/배포 워크플로우 가져와 적용

- Spring 서버 (passQL 백엔드):
  - `PROJECT-SPRING-SYNOLOGY-PR-PREVIEW.yaml` 이식 → PR에서 `@suh-lab server build` 호출 시 테스트 서버로 빌드·배포
  - `PROJECT-SPRING-SYNOLOGY-SIMPLE-CICD.yaml` 이식 (main 배포용)
- FastAPI (AI 서버):
  - `PROJECT-PYTHON-SYNOLOGY-PR-PREVIEW.yaml` 이식
  - `PROJECT-PYTHON-SYNOLOGY-CICD.yaml` 이식
- passQL 레포 구조(모노레포 여부, 서버 디렉토리 경로)에 맞게 `paths`, 작업 디렉토리, 환경 변수 조정
- Synology/Nexus 등 필요한 Secrets 목록 정리 후 등록 안내 문서 작성

### 2. 빌드 체크 전용 명령어 추가

- 배포 없이 **빌드 성공 여부만** 검증하는 경량 워크플로우 신설.
  - 예시 트리거: PR 코멘트 `@suh-lab server build-check` (또는 `build:check`)
  - Spring: `./gradlew clean build -x test` 수준의 컴파일/패키징만 수행
  - FastAPI: 의존성 설치 + `python -m compileall` 또는 `uvicorn --help` 수준의 import/부트 체크
- 결과는 PR 코멘트로 성공/실패 + 로그 요약 리포트
- 기존 `server build`(Preview 배포)와 명확히 구분되는 명령어/라벨 사용

### 3. 문서화

- `docs/` 하위에 서버별 Preview 빌드 / 빌드체크 사용법 가이드 추가
- `@suh-lab server build` vs `@suh-lab server build-check` 차이 표로 정리

⚙️작업 내용
---

- [ ] suh-github-template에서 Spring/Python PR-Preview·CICD 워크플로우 4종 복사 및 passQL 구조에 맞게 수정
- [ ] PR 코멘트 트리거 디스패처에 `server build-check` 명령 추가
- [ ] 빌드체크 전용 워크플로우 신규 작성 (Spring / FastAPI 각 1개)
- [ ] 필요한 Secrets 목록 정리 및 등록 가이드 작성
- [ ] 사용법 문서 추가
- [ ] 실제 PR에서 `server build`, `server build-check` 동작 검증

🙋‍♂️담당자
---

- 백엔드:
- AI 서버:
- DevOps:
