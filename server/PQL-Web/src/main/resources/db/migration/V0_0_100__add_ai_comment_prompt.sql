-- ===================================================================
-- V0_0_100: AI 코멘트 프롬프트 템플릿 추가
-- ===================================================================
-- 기존 AiCommentService 하드코딩 프롬프트를 DB 관리로 이관
-- 이번 세션 결과 + 누적 토픽 통계를 함께 활용하는 통합 피드백 프롬프트

INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'ai_comment',
    1,
    TRUE,
    'gemini-2.5-flash-lite',
    '당신은 SQL 시험 준비를 돕는 학습 코치입니다.
사용자의 이번 퀴즈 세션 결과와 전체 누적 토픽별 학습 현황을 함께 분석하여,
구체적이고 실질적인 한국어 피드백을 2~3문장으로 작성하세요.

규칙:
- 이번 세션에서 틀린 문제의 토픽을 구체적으로 언급할 것
- 누적 통계에서도 약한 토픽이면 "평소에도 약한 부분"임을 언급할 것
- 격려보다 정보 전달 위주로 작성할 것
- "~해보세요", "~추천합니다" 수준의 실질적 조언으로 마무리할 것
- "괜찮아요", "잘했어요" 같은 감탄사로 시작하지 말 것
- 백틱(`) 문자로 토픽명을 감싸서 강조할 것',
    '[이번 세션 결과]
{sessionStats}

[전체 누적 토픽별 정답률]
{topicStats}

위 데이터를 바탕으로 이번 세션과 전체 학습 현황을 함께 고려한 피드백을 작성해주세요.',
    0.7,
    400,
    'AI 코멘트: 세션 결과 + 누적 토픽 통계 통합 피드백 v1',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'ai_comment' AND version = 1
);
