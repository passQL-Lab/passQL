⚙️[기능추가][문서] SQLD 학습 플랫폼 PRD 문서 작성 및 설계 명세화

📝 현재 문제점
---

- passQL 프로젝트의 전체 설계 명세가 문서화되어 있지 않아 팀 간 구현 방향 공유가 어려운 상태임
- React(Frontend) / Spring Boot(Backend) / AI(Ollama+Qdrant) 각 레이어의 책임 범위, API 계약, 데이터 모델이 외부 토론 스레드에만 분산되어 있음

🛠️ 해결 방안 / 제안 기능
---

- 프로젝트 최상위 `docs/` 디렉토리에 `PRD.md`를 작성하여 단일 진실 공급원(Single Source of Truth)으로 관리
- 코드 프리즈 원칙(D+6 이후 코드 수정 금지)에 따라 모든 가변 설정은 DB/관리자 UI 경유임을 명세에 명시

⚙️ 작업 내용
---

- [ ] `docs/PRD.md` 작성
  - [ ] 제품 개요 및 차별점 정의
  - [ ] 시스템 아키텍처 구성도 (React → Spring Boot → MariaDB/Qdrant/Redis/Ollama)
  - [ ] 모노레포 디렉토리 구조 명세 (`client/`, `server/`, `ai/`)
  - [ ] DB 스키마 전체 정의
  - [ ] Public API 목록 및 응답 포맷 / errorCode 체계
  - [ ] Admin API 경로 목록 (Thymeleaf SSR)
  - [ ] Frontend 라우트 구조, 캐싱 전략, TypeScript 타입 명세
  - [ ] Backend 핵심 서비스 상세 (OllamaClient, SqlSafetyValidator, AiService, RAG 흐름)
  - [ ] 6일 개발 일정표 및 리스크 매트릭스
  - [ ] 코드 프리즈 이후 운영 가능 범위 명세

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
