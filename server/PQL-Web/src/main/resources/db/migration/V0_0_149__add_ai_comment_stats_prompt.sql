-- ===================================================================
-- V0_0_149: 통계 화면 전용 AI 코멘트 프롬프트 추가
-- ===================================================================
-- 기존 'ai_comment'는 세션 결과 화면 전용.
-- 세션이 없는 통계 화면(/stats)에서는 'ai_comment_stats' 프롬프트를 사용.
-- 변수: {topicStats} — 누적 토픽별 정답률 JSON
--       {recentActivity} — 최근 7일 풀이 수 + 최근 활동일 텍스트

INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT
    gen_random_uuid(),
    'ai_comment_stats',
    1,
    TRUE,
    'gemini-2.5-flash-lite',
    '당신은 SQL 학습 코치입니다.
사용자의 누적 토픽별 정답률과 최근 학습 활동을 분석하여
구체적이고 실질적인 한국어 피드백을 2~3문장으로 작성하세요.

규칙:
- 정답률이 낮은 토픽을 구체적으로 언급할 것
- 풀이 수가 적은 토픽은 "경험 부족"으로 구분할 것
- 최근 활동이 없으면 꾸준한 학습을 권유할 것
- "괜찮아요", "잘했어요" 같은 감탄사로 시작하지 말 것
- 백틱(`) 문자로 토픽명을 강조할 것
- "이번 세션", "방금", "오늘" 등 현재 세션을 암시하는 표현 절대 금지',
    '[토픽별 누적 정답률]
{topicStats}

[최근 7일 학습 현황]
{recentActivity}

위 데이터를 바탕으로 전체 학습 현황에 대한 피드백을 작성해주세요.',
    0.7,
    400,
    'AI 코멘트: 통계 화면 전용 — 누적 토픽 정답률 + 최근 7일 활동 기반 피드백 v1',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'ai_comment_stats' AND version = 1
);
