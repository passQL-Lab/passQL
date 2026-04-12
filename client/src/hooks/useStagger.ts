// client/src/hooks/useStagger.ts

/**
 * 섹션별 순차 페이드인(stagger) 애니메이션 클래스+딜레이를 반환한다.
 * 반환된 함수에 섹션 인덱스를 넘기면 CSS variable이 담긴 style 객체와
 * animate-stagger 클래스명을 함께 돌려준다.
 *
 * 사용 예:
 *   const stagger = useStagger();
 *   <section {...stagger(0)}>그리팅</section>
 *   <section {...stagger(1)}>카드</section>
 */
export function useStagger() {
  return function (index: number): {
    className: string;
  } {
    return {
      // Tailwind CSS 4 임의 CSS 변수 구문으로 --stagger-delay 주입 — style prop 불필요
      className: `animate-stagger [--stagger-delay:${index * 50}ms]`,
    };
  };
}
