# ❗[버그][배포] Vercel prod 환경에서 generate-choices 405 Method Not Allowed

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- Vercel 프로덕션(`passql.vercel.app`)에서 선택지 생성 SSE 요청이 405 오류로 실패
- 로컬 개발 환경에서는 정상 동작하나 Vercel 배포 후 동일 기능이 동작하지 않음
- 요청이 `https://api.passql.suhsaechan.kr/api/...`가 아닌 `https://passql.vercel.app/api/...`로 잘못 전달됨

🔄재현 방법
---

1. `passql.vercel.app`에서 문제 풀기 진입
2. 선택지 생성 SSE 요청 발생
3. 브라우저 네트워크 탭에서 `generate-choices` 요청 확인
4. 요청 URL이 `passql.vercel.app/api/...`로 가며 405 응답 수신

📸참고 자료
---

- `client/src/api/questions.ts` — `generateChoices()`에서 `fetch('/api/...')` 하드코딩
- `client/src/api/client.ts` — `BASE_URL` 폴백값이 `/api`(Vite 프록시용)로만 설정되어 있어 prod 환경에서 실제 API 서버로 연결 불가

✅예상 동작
---

- prod 환경에서 `VITE_API_BASE_URL` env 미설정 시에도 `https://api.passql.suhsaechan.kr/api`를 기본값으로 사용해야 함
- `generateChoices()` SSE 요청도 다른 API와 동일하게 `BASE_URL` 기반으로 요청되어야 함

⚙️환경 정보
---

- **OS**: Android 13
- **브라우저**: Chrome 146
- **기기**: Pixel 7 (모바일)
- **배포 환경**: Vercel (passql.vercel.app)

🙋‍♂️담당자
---

- **백엔드**:
- **프론트엔드**: @Cassiiopeia
- **디자인**:
