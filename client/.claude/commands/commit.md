현재 변경사항을 확인하고 커밋한다.

## 규칙

1. `git status`와 `git diff --staged`로 변경사항 파악
2. Co-Authored-By 태그 절대 금지
3. 커밋 메시지 형식: `<type>: <간단한 설명> #<이슈번호>`
   - type: feat, fix, refactor, docs, chore, perf, test, ci
   - 설명은 한국어, 간결하게
4. 이슈 태그는 현재 브랜치명에서 추출 (예: `#9`)
5. 스테이징 안 된 파일이 있으면 관련 파일만 `git add`
6. 인자가 주어지면 커밋 메시지 힌트로 활용

## 인자

$ARGUMENTS
