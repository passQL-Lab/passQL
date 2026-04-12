<!-- 제목: ❗ [버그][CICD] deploy 브랜치 Vercel 빌드 실패 — AppLayout 미사용 import -->

## 🗒️ 설명

- `deploy` 브랜치에 push 시 GitHub Actions Vercel 배포 워크플로가 TypeScript 컴파일 에러로 실패
- `src/components/AppLayout.tsx`에 미사용 import(`FileText`)가 남아 있어 `tsc` 단계에서 에러 발생
- `feature` 브랜치에서는 이미 수정됐으나 `deploy` 브랜치에 미반영된 상태

## 🔄 재현 방법

1. `deploy` 브랜치에 커밋 push
2. GitHub Actions `Deploy to Vercel` 워크플로 실행
3. **Build** 스텝에서 실패

## 📸 참고 자료

```
error TS6133: 'FileText' is declared but its value is never read.
src/components/AppLayout.tsx(2,16)
Process completed with exit code 2.
```

## ✅ 예상 동작

- `deploy` 브랜치 push 시 빌드가 성공하고 Vercel에 자동 배포되어야 함
- 해결 방법: 현재 feature 브랜치를 `deploy` 브랜치에 merge

## ⚙️ 환경 정보

- **OS**: ubuntu-24.04 (GitHub Actions Runner)
- **브라우저**: -
- **기기**: -

## 🙋‍♂️ 담당자

- **백엔드**: 이름
- **프론트엔드**: 이름
- **디자인**: 이름
