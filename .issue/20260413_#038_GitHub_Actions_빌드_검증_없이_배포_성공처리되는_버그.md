# ⚙️[기능개선][CI/CD] GitHub Actions 배포 워크플로우에 빌드 검증 단계 추가

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- `deploy` 브랜치 push 시 실행되는 `Vercel-deploy.yml` 워크플로우가 빌드 검증 없이 바로 `vercel deploy`를 실행함
- TypeScript 컴파일 오류 또는 Vite 빌드 오류가 있어도 GitHub Actions는 Success로 표시됨
- 실제로는 오류가 많은 코드가 Vercel에 배포되거나 배포가 무음으로 실패함
- 관련 파일: `.github/workflows/Vercel-deploy.yml`

🛠️해결 방안 / 제안 기능
---

- 배포 전 `npm ci` → `npm run build` (`tsc && vite build`) 단계를 워크플로우에 추가
- 빌드 실패 시 이후 Vercel 배포 단계를 실행하지 않고 워크플로우를 중단
- Actions 탭 > `Build (TypeScript + Vite)` 스텝에서 tsc/vite 오류 메시지 확인 가능하도록 구성
- 실패 시 Step Summary에 안내 메시지 노출

🙋‍♂️담당자
---

- 백엔드: 
- 프론트엔드: 
