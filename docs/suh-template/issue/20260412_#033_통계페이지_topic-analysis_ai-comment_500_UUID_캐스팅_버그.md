# ❗[버그][통계] 통계 페이지 topic-analysis / ai-comment 500 에러

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- 통계 페이지 진입 시 `/api/progress/topic-analysis`, `/api/progress/ai-comment` 두 엔드포인트가 500 Internal Server Error 반환
- `TopicAnalysisService.getTopicAnalysis()` 내부에서 PostgreSQL native query 결과의 `topic_uuid` 컬럼을 `(String)`으로 강제 캐스팅하다 `ClassCastException` 발생
- PostgreSQL JDBC 드라이버는 UUID 컬럼을 `java.util.UUID` 객체로 반환하므로 `String` 캐스팅 불가

🔄재현 방법
---

1. 통계 페이지(`/stats` 또는 대시보드) 진입
2. 브라우저 네트워크 탭에서 `/api/progress/topic-analysis`, `/api/progress/ai-comment` 확인
3. 두 요청 모두 500 응답 확인

📸참고 자료
---

```
java.lang.ClassCastException: class java.util.UUID cannot be cast to class java.lang.String
    at com.passql.submission.service.TopicAnalysisService.getTopicAnalysis(TopicAnalysisService.java:53)
    at com.passql.web.controller.ProgressController.getTopicAnalysis(ProgressController.java:38)
```

- 영향 파일: `PQL-Domain-Submission/src/main/java/com/passql/submission/service/TopicAnalysisService.java:53`
- 정상 동작 API: `/api/progress` (JPQL 사용, 영향 없음)

✅예상 동작
---

- 통계 페이지 진입 시 topic-analysis, ai-comment API 정상 응답 (200)

⚙️환경 정보
---

- **OS**: -
- **브라우저**: -
- **기기**: -

🙋‍♂️담당자
---

- **백엔드**: 이름
- **프론트엔드**: 이름
- **디자인**: 이름
