# ❗[버그][문제풀기] QuestionController Repository 직접 주입으로 SSE complete 이벤트 미전송

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- `CONCEPT_ONLY` 문제에서 선택지 생성이 서버 내부적으로는 성공하지만 SSE `complete` 이벤트가 클라이언트에 전달되지 않아 화면이 "선택지 준비 중..." 상태에서 멈추는 버그
- 서버 로그에 `[choice-gen-concept] success`가 정상 출력됨에도 불구하고 클라이언트 EventStream에서 `complete` 이벤트가 수신되지 않음
- `catch (Exception e)` 블록에 로그가 없어 예외 발생 여부를 추적 불가능한 상태

🔄재현 방법
---

1. `executionMode = CONCEPT_ONLY`인 문제 페이지 진입
2. SSE 선택지 생성 요청 발생 (`generate-choices`)
3. 서버 로그에 `[choice-gen-concept] success` 확인
4. 브라우저 네트워크 탭 EventStream에서 `complete` 이벤트 미수신 확인
5. 화면이 "선택지 준비 중..." 상태에서 무한 대기

📸참고 자료
---

- `server/PQL-Web/src/main/java/com/passql/web/controller/QuestionController.java` — `generateChoices()` 메서드 내 `choiceSetItemRepository`를 Controller에서 직접 주입하여 호출 (CLAUDE.md 규칙 위반: Controller에서 Repository 직접 주입 금지)
- VirtualThread 내에서 `@Transactional` 컨텍스트 없이 Repository 조회 시도 → 예외 발생 가능
- `catch (Exception e)` 블록에 로그가 없어 silent fail 발생

✅예상 동작
---

- 서버에서 `[choice-gen-concept] success` 로그 이후 SSE `complete` 이벤트가 클라이언트에 정상 전달되어야 함
- Repository 조회는 Service 레이어를 통해 적절한 트랜잭션 컨텍스트 내에서 실행되어야 함
- 예외 발생 시 `catch` 블록에서 로그가 출력되어 디버깅이 가능해야 함

⚙️환경 정보
---

- **OS**: 서버 (Docker, Linux)
- **브라우저**: Chrome
- **기기**: Vercel (passql.vercel.app) / 로컬

🙋‍♂️담당자
---

- **백엔드**: @Cassiiopeia
- **프론트엔드**: 
- **디자인**: 
