⚙️ [기능추가][Server] /api/health 헬스체크 엔드포인트 구현

📝 현재 문제점
---

- 현재 백엔드는 부팅 후 외부 의존성(DB, Qdrant, Ollama)의 연결 상태를 확인할 수 있는 단일 엔드포인트가 없습니다.
- 운영/개발 중 어떤 컴포넌트가 죽었는지 확인하려면 각각 로그를 뒤져야 하므로, 프론트엔드/배포 파이프라인/모니터링이 단일 엔드포인트로 상태를 조회할 수 있는 통합 헬스체크가 필요합니다.
- 특히 D2 단계에서는 Ollama, Qdrant 인프라 검증이 병행되므로, 각 컴포넌트가 살아있는지 즉시 확인 가능한 진단 수단이 필요합니다.

🛠️ 해결 방안 / 제안 기능
---

- `GET /api/health` 엔드포인트를 신설하여 핵심 외부 의존성의 상태를 한 번에 반환합니다.
- 응답에는 전체 상태(`status`)와 각 컴포넌트별 상태(`db`, `qdrant`, `ollama`)를 포함합니다.
- 각 컴포넌트는 `UP` / `DOWN` 두 가지 상태로 표현하고, 실패 시 짧은 사유 메시지를 함께 내려 디버깅을 돕습니다.
- 컴포넌트 한 개라도 `DOWN`이면 전체 `status`는 `DEGRADED`로 표시합니다 (FE에서 배지 표시 가능).
- 응답 시간이 길어지지 않도록 각 점검은 짧은 타임아웃을 둡니다.

⚙️ 작업 내용
---

- [ ] `PQL-Web` 모듈에 `HealthController` 추가
  - 패키지: `com.passql.web.controller.health`
  - 엔드포인트: `GET /api/health`
- [ ] 응답 DTO 정의
  - `HealthResponse { status, components }`
  - `ComponentHealth { status, message? }`
- [ ] DB 헬스체크 로직
  - `DataSource`에서 커넥션 획득 후 `SELECT 1` 수행 (짧은 타임아웃)
- [ ] Qdrant 헬스체크 로직
  - Qdrant 클러스터 정보 조회 또는 컬렉션 리스트 조회로 가용성 확인
- [ ] Ollama 헬스체크 로직
  - Ollama `/api/tags` 등 가벼운 엔드포인트 호출로 가용성 확인
- [ ] 각 점검에 짧은 타임아웃 적용 (예: 2초) 및 예외 시 `DOWN` 처리
- [ ] 한 컴포넌트라도 `DOWN`이면 전체 `status` 를 `DEGRADED`로 처리 (전부 UP이면 `UP`)
- [ ] curl 검증 + 응답 예시 문서화 (정상 / DB DOWN / Ollama DOWN 케이스)
- [ ] Swagger 문서에 노출

🙋‍♂️ 담당자
---

- 백엔드: SUH SAECHAN
