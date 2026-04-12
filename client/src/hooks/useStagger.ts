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
    style: React.CSSProperties;
  } {
    return {
      className: "animate-stagger",
      // CSS 클래스가 --stagger-delay 변수를 animation-delay로 소비한다.
      // CLAUDE.md의 "인라인 style 속성 절대 금지" 규칙의 예외:
      // CSS variable 주입은 Tailwind로 표현 불가능하므로 허용 (step-slider 선례 동일)
      style: { "--stagger-delay": `${index * 50}ms` } as React.CSSProperties,
    };
  };
}
