# ❗ [버그][CICD] deploy 브랜치 Vercel 빌드 실패 #152

### 📌 작업 개요

`deploy` 브랜치 push 시 GitHub Actions Vercel 배포 워크플로가 실패하는 문제 수정. 초기에는 TypeScript 미사용 import 에러였으나, feature 브랜치 merge 이후 `vercel build` CLI 명령의 환경 제약 문제(`spawn sh ENOENT`)가 추가로 발생. 워크플로를 단순화하여 해결.

---

### 🔍 문제 분석

**1차 오류: TypeScript 컴파일 에러**

`AppLayout.tsx`에 `FileText` import가 남아 있었으나 실제로 사용되지 않아 `tsc --noUnusedLocals` 에러 발생. main 브랜치에서 `Sparkles`로 교체된 변경사항이 deploy 브랜치에 미반영된 상태였음.

**2차 오류: vercel build 환경 제약**

feature 브랜치 merge 후 `vercel build --prod` 명령이 GitHub Actions runner 환경에서 `spawn sh ENOENT` 에러로 실패. Vercel CLI가 내부적으로 shell을 spawn하는 과정에서 환경 불일치 발생.

---

### ✅ 구현 내용

#### 워크플로 단순화
- **파일**: `.github/workflows/Vercel-deploy.yml`
- **변경 내용**: Node.js 설치, `npm ci`, `vercel pull`, `vercel build` 단계 전체 제거. `vercel deploy --prod --yes` 한 줄로 대체
- **이유**: Vercel 서버에서 직접 빌드하므로 로컬 빌드 환경 의존성 불필요. `vercel deploy`는 소스를 업로드하면 Vercel 인프라에서 빌드 및 배포를 처리함

---

### 🔧 주요 변경사항 상세

#### Vercel-deploy.yml (변경 전 → 후)

**제거된 단계 (5개 → 2개로 축소):**
- Setup Node.js
- Install dependencies (`npm ci`)
- Verify Vercel Secrets
- Pull Vercel Environment (`vercel pull`)
- Build Project Artifacts (`vercel build --prod`, 재시도 3회 포함)
- Deploy (`vercel deploy --prebuilt`, 재시도 3회 포함)

**최종 구조:**
1. Checkout repository
2. Install Vercel CLI
3. Deploy (`vercel deploy --prod --yes --token=...`)
4. Deployment Summary

**특이사항**:
- 기존 워크플로의 재시도 로직(3회)은 `vercel build` 실패 대응용이었으므로 함께 제거
- `vercel deploy`는 Vercel 서버 측 빌드이므로 `spawn sh` 환경 문제 미발생
- `nodeVersion: 24.x` 프로젝트 설정 충돌 문제도 서버 빌드로 전환하며 우회됨

---

### 🧪 테스트 및 검증

- 로컬에서 `vercel deploy --prod --yes` 직접 실행 → 배포 성공 확인
- Production URL 정상 응답 확인

---

### 📌 참고사항

- `vercel.json`에 추가했던 `nodeVersion: 22.x` 필드는 Vercel에서 지원하지 않는 속성으로 확인되어 제거
- `.vercel/project.json`의 `nodeVersion: 24.x` 설정은 서버 빌드 방식에서는 무관
