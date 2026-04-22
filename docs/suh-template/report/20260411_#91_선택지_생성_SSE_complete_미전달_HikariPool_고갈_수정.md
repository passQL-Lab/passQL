# ❗[버그][문제풀기] 선택지 생성 성공 후 SSE complete 미전달로 화면 멈춤

## 개요

두 번째 이후 문제에서 선택지 생성은 DB에 정상 저장되지만 SSE `complete` 이벤트가 클라이언트에 전달되지 않아 "선택지 생성 중..." 상태에서 화면이 멈추는 버그를 수정하였다. 원인은 `ChoiceSetGenerationService` 내부에서 같은 클래스의 `@Transactional` 메서드를 직접 호출(self-invocation)하여 Spring AOP 프록시가 동작하지 않았고, 그 결과 HikariPool 커넥션이 정상 반환되지 않아 SSE 스레드가 블로킹된 것이었다.

## 변경 사항

### 서버 — 트랜잭션 분리

- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetSaveService.java` (신규 생성)
  - `saveSuccess()`, `saveConceptSuccess()`, `saveFailed()` 메서드를 별도 `@Service` 빈으로 분리
  - 외부 빈 호출로 Spring AOP 프록시를 통해 `@Transactional`이 정상 적용됨

- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java`
  - `QuestionChoiceSetRepository`, `QuestionChoiceSetItemRepository` 의존성 제거
  - save 메서드 3개 삭제 후 `ChoiceSetSaveService` 주입으로 대체

- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetResolver.java`
  - `resolveForUser()`의 클래스 레벨 `@Transactional` 제거 (AI·샌드박스 호출 중 장시간 트랜잭션 유지 방지)
  - 프리페치 캐시 `consumed_at` 마킹을 별도 `markConsumed()` 메서드(`@Transactional`)로 분리

## 주요 구현 내용

**Self-invocation 문제**: Spring `@Transactional`은 AOP 프록시 기반으로 동작하므로 같은 클래스 내부에서 `this.saveSuccess()`를 호출하면 프록시를 거치지 않아 트랜잭션이 열리지 않는다. 트랜잭션 없이 `saveAndFlush()`가 호출되면 매번 새 DB 커넥션을 요청하고 즉시 반환하는 과정이 반복되어 HikariPool이 Pool-3, 4, 5, 6...으로 지속 생성/종료되었다. 커넥션 풀이 고갈되면서 SSE 스레드가 이후 DB 조회에서 커넥션을 획득하지 못하고 블로킹되어 `complete` 이벤트가 전달되지 않았다.

**해결 방향**: save 전담 빈(`ChoiceSetSaveService`)을 별도로 분리하여 외부 빈 호출로 프록시를 통하도록 구조를 변경하였다. 또한 `resolveForUser()`의 불필요한 장시간 트랜잭션도 함께 제거하였다.

## 주의사항

- `ChoiceSetSaveService`는 save 전용 빈으로, 조회 로직은 추가하지 않는다.
- `markConsumed()`는 `ChoiceSetResolver` 내 `protected @Transactional` 메서드이므로 동일한 self-invocation 문제를 피하려면 외부에서 호출되는 구조를 유지해야 한다.
- 첫 번째 문제에서는 커넥션이 남아있어 정상 동작한 것이며, 두 번째 문제부터 Pool 고갈로 증상이 나타났다.
